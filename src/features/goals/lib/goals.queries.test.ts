import { describe, expect, it } from "vitest"
import {
  getGoalById,
  getGroupGoals,
  getTopActiveGoals,
  getUserGoals,
} from "@/features/goals/lib/goals.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createGoal,
  createGoalContribution,
  createGroup,
  createGroupMember,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

describe("getUserGoals", () => {
  it("returns empty array when user has no personal goals", async () => {
    const user = await createUser()
    const result = await getUserGoals(user.id)
    expect(result).toEqual([])
  })

  it("returns personal goals with progress (sum, count, percentage capped at 100)", async () => {
    const user = await createUser()
    const g1 = await createGoal(user.id, {
      name: "Vacation",
      targetAmount: dollars(1000),
    })
    await createGoalContribution(user.id, g1.id, { amount: dollars(250) })
    await createGoalContribution(user.id, g1.id, { amount: dollars(500) })

    const g2 = await createGoal(user.id, {
      name: "Overshoot",
      targetAmount: dollars(100),
    })
    await createGoalContribution(user.id, g2.id, { amount: dollars(250) })

    const result = await getUserGoals(user.id)
    const byName = Object.fromEntries(result.map((g) => [g.name, g]))

    expect(byName.Vacation.currentAmount).toBe(dollars(750))
    expect(byName.Vacation.percentage).toBe(75)
    expect(byName.Vacation.contributionCount).toBe(2)

    expect(byName.Overshoot.percentage).toBe(100)
    expect(byName.Overshoot.contributionCount).toBe(1)
  })

  it("excludes group goals (groupId !== null)", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    await createGoal(user.id, { name: "Personal", targetAmount: dollars(100) })

    await prisma.goal.create({
      data: {
        name: "Group Goal",
        targetAmount: dollars(500),
        status: "ACTIVE",
        user: { connect: { id: user.id } },
        group: { connect: { id: group.id } },
      },
    })

    const result = await getUserGoals(user.id)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Personal")
  })

  it("filters by status when provided", async () => {
    const user = await createUser()
    await createGoal(user.id, { name: "Active", targetAmount: dollars(100), status: "ACTIVE" })
    await createGoal(user.id, { name: "Done", targetAmount: dollars(100), status: "COMPLETED" })

    const onlyActive = await getUserGoals(user.id, "ACTIVE")
    expect(onlyActive.map((g) => g.name)).toEqual(["Active"])
  })
})

describe("getGoalById", () => {
  it("returns null when the goal does not exist", async () => {
    const result = await getGoalById("non-existent", "user")
    expect(result).toBeNull()
  })

  it("returns the goal with contributions ordered desc and computed progress", async () => {
    const user = await createUser()
    const goal = await createGoal(user.id, { targetAmount: dollars(1000) })
    await createGoalContribution(user.id, goal.id, {
      amount: dollars(100),
      date: new Date(2026, 0, 10),
    })
    await createGoalContribution(user.id, goal.id, {
      amount: dollars(300),
      date: new Date(2026, 1, 10),
    })

    const result = await getGoalById(goal.id, user.id)
    expect(result).not.toBeNull()
    expect(result!.currentAmount).toBe(dollars(400))
    expect(result!.percentage).toBe(40)
    expect(result!.contributionCount).toBe(2)
    expect(result!.contributions[0].amount).toBe(dollars(300))
    expect(result!.contributions[1].amount).toBe(dollars(100))
  })
})

describe("getGroupGoals", () => {
  it("returns goals scoped to the group with progress", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const goal = await prisma.goal.create({
      data: {
        name: "Trip",
        targetAmount: dollars(2000),
        status: "ACTIVE",
        user: { connect: { id: user.id } },
        group: { connect: { id: group.id } },
      },
    })
    await createGoalContribution(user.id, goal.id, { amount: dollars(500) })

    const result = await getGroupGoals(group.id)
    expect(result).toHaveLength(1)
    expect(result[0].currentAmount).toBe(dollars(500))
    expect(result[0].percentage).toBe(25)
  })

  it("filters by status", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    await prisma.goal.create({
      data: {
        name: "A",
        targetAmount: dollars(100),
        status: "ACTIVE",
        user: { connect: { id: user.id } },
        group: { connect: { id: group.id } },
      },
    })
    await prisma.goal.create({
      data: {
        name: "B",
        targetAmount: dollars(100),
        status: "COMPLETED",
        user: { connect: { id: user.id } },
        group: { connect: { id: group.id } },
      },
    })
    const result = await getGroupGoals(group.id, "COMPLETED")
    expect(result.map((g) => g.name)).toEqual(["B"])
  })
})

describe("getTopActiveGoals", () => {
  it("returns only ACTIVE personal goals ordered by targetDate asc and respects limit", async () => {
    const user = await createUser()
    await createGoal(user.id, {
      name: "Far",
      targetAmount: dollars(100),
      targetDate: new Date(2027, 0, 1),
    })
    await createGoal(user.id, {
      name: "Soon",
      targetAmount: dollars(100),
      targetDate: new Date(2026, 5, 1),
    })
    await createGoal(user.id, {
      name: "Mid",
      targetAmount: dollars(100),
      targetDate: new Date(2026, 8, 1),
    })
    await createGoal(user.id, {
      name: "Done",
      targetAmount: dollars(100),
      targetDate: new Date(2026, 1, 1),
      status: "COMPLETED",
    })

    const result = await getTopActiveGoals(user.id, 2)
    expect(result.map((g) => g.name)).toEqual(["Soon", "Mid"])
  })

  it("excludes group goals", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    await prisma.goal.create({
      data: {
        name: "Group",
        targetAmount: dollars(100),
        status: "ACTIVE",
        user: { connect: { id: user.id } },
        group: { connect: { id: group.id } },
      },
    })
    const result = await getTopActiveGoals(user.id)
    expect(result).toEqual([])
  })
})
