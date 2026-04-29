import { describe, expect, it } from "vitest"
import {
  getGroupCategoryBreakdown,
  getGroupMonthlyFlow,
  getGroupOverview,
  getGroupTransactions,
  getMemberBalances,
} from "@/features/group-finances/lib/group-finances.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createGroup,
  createGroupMember,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

const APRIL_2026 = new Date(2026, 3, 15)
const MARCH_2026 = new Date(2026, 2, 10)

async function createGroupTransaction(input: {
  userId: string
  groupId: string
  categoryId: string
  amount: number
  date?: Date
  isTemplate?: boolean
  description?: string
}) {
  const date = input.date ?? APRIL_2026
  return prisma.transaction.create({
    data: {
      user: { connect: { id: input.userId } },
      group: { connect: { id: input.groupId } },
      category: { connect: { id: input.categoryId } },
      description: input.description ?? "group tx",
      amount: input.amount,
      type: "EXPENSE",
      date,
      impactDate: date,
      isTemplate: input.isTemplate ?? false,
    },
  })
}

async function createSplit(input: {
  transactionId: string
  userId: string
  amount: number
  isPaid?: boolean
}) {
  return prisma.transactionSplit.create({
    data: {
      transaction: { connect: { id: input.transactionId } },
      user: { connect: { id: input.userId } },
      amount: input.amount,
      isPaid: input.isPaid ?? false,
      paidAt: input.isPaid ? new Date() : null,
    },
  })
}

describe("getGroupTransactions", () => {
  it("returns paginated transactions scoped to the group, with payer and splits", async () => {
    const payer = await createUser({ name: "Payer" })
    const member = await createUser({ name: "Member" })
    const group = await createGroup()
    await createGroupMember(payer.id, group.id, "OWNER")
    await createGroupMember(member.id, group.id, "MEMBER")
    const cat = await createCategory(payer.id)

    const tx = await createGroupTransaction({
      userId: payer.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(100),
      description: "Pizza",
    })
    await createSplit({ transactionId: tx.id, userId: payer.id, amount: dollars(50) })
    await createSplit({ transactionId: tx.id, userId: member.id, amount: dollars(50) })

    const result = await getGroupTransactions(group.id, { page: 1, pageSize: 10 })
    expect(result.total).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].payer.name).toBe("Payer")
    expect(result.data[0].splits).toHaveLength(2)
  })

  it("excludes templates and other groups", async () => {
    const user = await createUser()
    const groupA = await createGroup()
    const groupB = await createGroup()
    await createGroupMember(user.id, groupA.id, "OWNER")
    await createGroupMember(user.id, groupB.id, "OWNER")
    const cat = await createCategory(user.id)

    await createGroupTransaction({
      userId: user.id,
      groupId: groupA.id,
      categoryId: cat.id,
      amount: dollars(100),
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: groupA.id,
      categoryId: cat.id,
      amount: dollars(100),
      isTemplate: true,
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: groupB.id,
      categoryId: cat.id,
      amount: dollars(100),
    })

    const result = await getGroupTransactions(groupA.id, { page: 1, pageSize: 10 })
    expect(result.total).toBe(1)
  })

  it("applies dateFrom / dateTo and category filters", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const food = await createCategory(user.id, { name: "Food" })
    const fun = await createCategory(user.id, { name: "Fun" })

    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: food.id,
      amount: dollars(10),
      date: MARCH_2026,
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: food.id,
      amount: dollars(20),
      date: APRIL_2026,
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: fun.id,
      amount: dollars(30),
      date: APRIL_2026,
    })

    const result = await getGroupTransactions(group.id, {
      page: 1,
      pageSize: 10,
      dateFrom: "2026-04-01",
      categoryId: food.id,
    })
    expect(result.total).toBe(1)
    expect(result.data[0].amount).toBe(dollars(20))
  })

  it("paginates correctly", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const cat = await createCategory(user.id)
    for (let i = 0; i < 5; i++) {
      await createGroupTransaction({
        userId: user.id,
        groupId: group.id,
        categoryId: cat.id,
        amount: dollars(10),
        date: new Date(2026, 3, 1 + i),
      })
    }
    const page2 = await getGroupTransactions(group.id, { page: 2, pageSize: 2 })
    expect(page2.data).toHaveLength(2)
    expect(page2.totalPages).toBe(3)
    expect(page2.page).toBe(2)
  })
})

describe("getMemberBalances", () => {
  it("returns one balance row per group member with zeros when no transactions exist", async () => {
    const a = await createUser({ name: "Alice" })
    const b = await createUser({ name: "Bob" })
    const group = await createGroup()
    await createGroupMember(a.id, group.id, "OWNER")
    await createGroupMember(b.id, group.id, "MEMBER")

    const result = await getMemberBalances(group.id)
    expect(result).toHaveLength(2)
    for (const row of result) {
      expect(row.totalPaid).toBe(0)
      expect(row.totalOwed).toBe(0)
      expect(row.totalOwes).toBe(0)
      expect(row.totalSettled).toBe(0)
      expect(row.netBalance).toBe(0)
    }
  })

  it("computes paid/owed/owes/settled correctly for unpaid and paid splits", async () => {
    const payer = await createUser({ name: "Payer" })
    const debtor = await createUser({ name: "Debtor" })
    const group = await createGroup()
    await createGroupMember(payer.id, group.id, "OWNER")
    await createGroupMember(debtor.id, group.id, "MEMBER")
    const cat = await createCategory(payer.id)

    // Tx1: payer paid 100, debtor owes 60 (unpaid)
    const tx1 = await createGroupTransaction({
      userId: payer.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(100),
    })
    await createSplit({ transactionId: tx1.id, userId: payer.id, amount: dollars(40) })
    await createSplit({ transactionId: tx1.id, userId: debtor.id, amount: dollars(60) })

    // Tx2: payer paid 50, debtor's 30 share is already settled
    const tx2 = await createGroupTransaction({
      userId: payer.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(50),
    })
    await createSplit({ transactionId: tx2.id, userId: payer.id, amount: dollars(20) })
    await createSplit({
      transactionId: tx2.id,
      userId: debtor.id,
      amount: dollars(30),
      isPaid: true,
    })

    const balances = await getMemberBalances(group.id)
    const byUser = Object.fromEntries(balances.map((b) => [b.userId, b]))

    expect(byUser[payer.id].totalPaid).toBe(dollars(150))
    expect(byUser[payer.id].totalOwed).toBe(dollars(60))
    expect(byUser[payer.id].totalOwes).toBe(0)
    expect(byUser[payer.id].netBalance).toBe(dollars(60))

    expect(byUser[debtor.id].totalPaid).toBe(0)
    expect(byUser[debtor.id].totalOwes).toBe(dollars(60))
    expect(byUser[debtor.id].totalSettled).toBe(dollars(30))
    expect(byUser[debtor.id].netBalance).toBe(-dollars(60))
  })
})

describe("getGroupOverview", () => {
  it("returns zeros when group has no transactions", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const overview = await getGroupOverview(group.id, 4, 2026)
    expect(overview.totalExpenses).toBe(0)
    expect(overview.totalTransactions).toBe(0)
    expect(overview.totalUnsettled).toBe(0)
    expect(overview.memberCount).toBe(1)
  })

  it("aggregates monthly expenses, unsettled splits and member count", async () => {
    const a = await createUser()
    const b = await createUser()
    const group = await createGroup()
    await createGroupMember(a.id, group.id, "OWNER")
    await createGroupMember(b.id, group.id, "MEMBER")
    const cat = await createCategory(a.id)

    const tx = await createGroupTransaction({
      userId: a.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(200),
      date: APRIL_2026,
    })
    await createSplit({
      transactionId: tx.id,
      userId: a.id,
      amount: dollars(100),
      isPaid: true,
    })
    await createSplit({
      transactionId: tx.id,
      userId: b.id,
      amount: dollars(100),
      isPaid: false,
    })

    // Out-of-month tx should not count in totalExpenses but unpaid splits still count
    await createGroupTransaction({
      userId: a.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(99),
      date: MARCH_2026,
    })

    const overview = await getGroupOverview(group.id, 4, 2026)
    expect(overview.totalExpenses).toBe(dollars(200))
    expect(overview.totalTransactions).toBe(1)
    expect(overview.totalUnsettled).toBe(dollars(100))
    expect(overview.memberCount).toBe(2)
  })
})

describe("getGroupCategoryBreakdown", () => {
  it("returns empty when no transactions", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const result = await getGroupCategoryBreakdown(group.id, 4, 2026)
    expect(result).toEqual([])
  })

  it("groups by category with percentage totals, sorted desc", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const food = await createCategory(user.id, { name: "Food" })
    const fun = await createCategory(user.id, { name: "Fun" })

    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: food.id,
      amount: dollars(75),
      date: APRIL_2026,
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: fun.id,
      amount: dollars(25),
      date: APRIL_2026,
    })

    const result = await getGroupCategoryBreakdown(group.id, 4, 2026)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("Food")
    expect(result[0].percentage).toBe(75)
    expect(result[1].name).toBe("Fun")
    expect(result[1].percentage).toBe(25)
  })
})

describe("getGroupMonthlyFlow", () => {
  it("returns N months ending at endMonth/endYear with totals per month", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const cat = await createCategory(user.id)

    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(500),
      date: APRIL_2026,
    })
    await createGroupTransaction({
      userId: user.id,
      groupId: group.id,
      categoryId: cat.id,
      amount: dollars(300),
      date: MARCH_2026,
    })

    const flow = await getGroupMonthlyFlow(group.id, 4, 2026, 3)
    const byMonth = Object.fromEntries(flow.map((f) => [f.month, f.total]))
    expect(byMonth["2026-04"]).toBe(dollars(500))
    expect(byMonth["2026-03"]).toBe(dollars(300))
    expect(byMonth["2026-02"]).toBe(0)
  })

  it("crosses year boundaries", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const flow = await getGroupMonthlyFlow(group.id, 1, 2026, 3)
    expect(flow.map((f) => f.month)).toEqual(["2025-11", "2025-12", "2026-01"])
  })
})
