import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const e = new Error("NEXT_REDIRECT") as Error & { digest: string }
    e.digest = `NEXT_REDIRECT;replace;${url};307;`
    throw e
  }),
}))
vi.mock("@/shared/lib/auth", () => ({
  requireSession: vi.fn(),
  getSession: vi.fn(),
}))

import { createGroupTransactionAction } from "@/features/group-finances/actions/create-group-transaction.action"
import { deleteGroupTransactionAction } from "@/features/group-finances/actions/delete-group-transaction.action"
import { settleSplitAction } from "@/features/group-finances/actions/settle-split.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createGroup,
  createGroupMember,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

async function setupGroupWithTwoMembers() {
  const userA = await createUser()
  const userB = await createUser()
  const group = await createGroup({ currency: "USD" })
  await createGroupMember(userA.id, group.id, "OWNER")
  await createGroupMember(userB.id, group.id, "MEMBER")
  return { userA, userB, group }
}

describe("createGroupTransactionAction", () => {
  it("creates a transaction with EQUAL splits across all group members", async () => {
    const { userA, userB, group } = await setupGroupWithTwoMembers()
    setSessionUser(userA.id)
    const cat = await createCategory(userA.id)

    const result = await createGroupTransactionAction(
      { success: true, data: undefined },
      formData({
        description: "Dinner",
        amount: "10000",
        type: "EXPENSE",
        categoryId: cat.id,
        paymentMethod: "DEBIT",
        date: "2026-04-15",
        groupId: group.id,
        splitRule: "EQUAL",
        splits: JSON.stringify([
          { userId: userA.id },
          { userId: userB.id },
        ]),
      }),
    )

    expect(result.success).toBe(true)
    const tx = await prisma.transaction.findFirstOrThrow({
      where: { groupId: group.id },
      include: { splits: true },
    })
    expect(tx.splits).toHaveLength(2)
    const total = tx.splits.reduce((sum, s) => sum + s.amount, 0)
    expect(total).toBe(10000)

    // Payer's split is auto-marked as paid
    const payerSplit = tx.splits.find((s) => s.userId === userA.id)
    expect(payerSplit?.isPaid).toBe(true)
  })

  it("rejects when caller is not a group member", async () => {
    const { group } = await setupGroupWithTwoMembers()
    const outsider = await createUser()
    setSessionUser(outsider.id)
    const cat = await createCategory(outsider.id)

    const result = await createGroupTransactionAction(
      { success: true, data: undefined },
      formData({
        description: "Sneaky",
        amount: "1000",
        type: "EXPENSE",
        categoryId: cat.id,
        paymentMethod: "CASH",
        date: "2026-04-15",
        groupId: group.id,
        splitRule: "EQUAL",
        splits: JSON.stringify([{ userId: outsider.id }]),
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_NOT_MEMBER")
  })
})

describe("deleteGroupTransactionAction", () => {
  it("the payer can delete their own group transaction", async () => {
    const { userA, group } = await setupGroupWithTwoMembers()
    setSessionUser(userA.id)
    const cat = await createCategory(userA.id)
    const tx = await prisma.transaction.create({
      data: {
        amount: 1000,
        description: "x",
        date: new Date(),
        impactDate: new Date(),
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        category: { connect: { id: cat.id } },
        user: { connect: { id: userA.id } },
        group: { connect: { id: group.id } },
      },
    })

    const result = await deleteGroupTransactionAction(
      { success: true, data: undefined },
      formData({ id: tx.id }),
    )

    expect(result.success).toBe(true)
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).toBeNull()
  })

  it("a regular MEMBER cannot delete another member's transaction", async () => {
    const { userA, userB, group } = await setupGroupWithTwoMembers()
    setSessionUser(userB.id)
    const cat = await createCategory(userA.id)
    const tx = await prisma.transaction.create({
      data: {
        amount: 1000,
        description: "x",
        date: new Date(),
        impactDate: new Date(),
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        category: { connect: { id: cat.id } },
        user: { connect: { id: userA.id } },
        group: { connect: { id: group.id } },
      },
    })

    const result = await deleteGroupTransactionAction(
      { success: true, data: undefined },
      formData({ id: tx.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_TRANSACTION_DELETE_PERMISSION_DENIED")
  })
})

describe("settleSplitAction", () => {
  it("toggles the split's isPaid flag for a group member", async () => {
    const { userA, userB, group } = await setupGroupWithTwoMembers()
    setSessionUser(userB.id)
    const cat = await createCategory(userA.id)
    const tx = await prisma.transaction.create({
      data: {
        amount: 1000,
        description: "x",
        date: new Date(),
        impactDate: new Date(),
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        category: { connect: { id: cat.id } },
        user: { connect: { id: userA.id } },
        group: { connect: { id: group.id } },
      },
    })
    const split = await prisma.transactionSplit.create({
      data: {
        amount: 500,
        isPaid: false,
        transaction: { connect: { id: tx.id } },
        user: { connect: { id: userB.id } },
      },
    })

    const result = await settleSplitAction(
      { success: true, data: undefined },
      formData({ splitId: split.id }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.transactionSplit.findUniqueOrThrow({ where: { id: split.id } })
    expect(updated.isPaid).toBe(true)
    expect(updated.paidAt).not.toBeNull()
  })

  it("rejects when caller is not a member of the group", async () => {
    const { userA, group } = await setupGroupWithTwoMembers()
    const outsider = await createUser()
    setSessionUser(outsider.id)
    const cat = await createCategory(userA.id)
    const tx = await prisma.transaction.create({
      data: {
        amount: 1000,
        description: "x",
        date: new Date(),
        impactDate: new Date(),
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        category: { connect: { id: cat.id } },
        user: { connect: { id: userA.id } },
        group: { connect: { id: group.id } },
      },
    })
    const split = await prisma.transactionSplit.create({
      data: {
        amount: 500,
        isPaid: false,
        transaction: { connect: { id: tx.id } },
        user: { connect: { id: userA.id } },
      },
    })

    const result = await settleSplitAction(
      { success: true, data: undefined },
      formData({ splitId: split.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_NOT_MEMBER")
  })
})
