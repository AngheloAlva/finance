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

import { createGoalAction } from "@/features/goals/actions/create-goal.action"
import { updateGoalAction } from "@/features/goals/actions/update-goal.action"
import { deleteGoalAction } from "@/features/goals/actions/delete-goal.action"
import { addContributionAction } from "@/features/goals/actions/add-contribution.action"
import { prisma } from "@/shared/lib/prisma"
import { createGoal, createUser, dollars } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createGoalAction", () => {
  it("creates a personal ACTIVE goal for the session user", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createGoalAction(
      { success: true, data: undefined },
      formData({
        name: "Trip",
        targetAmount: "100000",
      }),
    )

    expect(result.success).toBe(true)
    const goals = await prisma.goal.findMany({ where: { userId: user.id } })
    expect(goals).toHaveLength(1)
    expect(goals[0].status).toBe("ACTIVE")
    expect(goals[0].targetAmount).toBe(100000)
  })

  it("returns VALIDATION_ERROR for non-positive targetAmount", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createGoalAction(
      { success: true, data: undefined },
      formData({ name: "Trip", targetAmount: "0" }),
    )
    expect(result.success).toBe(false)
  })
})

describe("updateGoalAction", () => {
  it("updates the owner's ACTIVE goal", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, { targetAmount: dollars(100) })

    const result = await updateGoalAction(
      { success: true, data: undefined },
      formData({
        id: goal.id,
        name: "Renamed",
        targetAmount: "200000",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.goal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updated.name).toBe("Renamed")
    expect(updated.targetAmount).toBe(200000)
  })

  it("rejects updates to a COMPLETED goal", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, {
      targetAmount: dollars(100),
      status: "COMPLETED",
    })

    const result = await updateGoalAction(
      { success: true, data: undefined },
      formData({ id: goal.id, name: "x", targetAmount: "100" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GOAL_NOT_ACTIVE")
  })
})

describe("deleteGoalAction", () => {
  it("deletes the owner's goal", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, { targetAmount: dollars(100) })

    const result = await deleteGoalAction(
      { success: true, data: undefined },
      formData({ id: goal.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.goal.findUnique({ where: { id: goal.id } })).toBeNull()
  })

  it("rejects another user's goal", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const goal = await createGoal(owner.id, { targetAmount: dollars(100) })

    const result = await deleteGoalAction(
      { success: true, data: undefined },
      formData({ id: goal.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GOAL_NOT_OWNED")
  })
})

describe("addContributionAction", () => {
  it("creates a contribution and keeps goal ACTIVE when total is below target", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, { targetAmount: dollars(1000) })

    const result = await addContributionAction(
      { success: true, data: undefined },
      formData({
        goalId: goal.id,
        amount: "10000",
        date: "2026-04-01",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.goal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updated.status).toBe("ACTIVE")
  })

  it("auto-completes the goal when total reaches target", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, { targetAmount: dollars(100) })

    const result = await addContributionAction(
      { success: true, data: undefined },
      formData({
        goalId: goal.id,
        amount: String(dollars(100)),
        date: "2026-04-01",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.goal.findUniqueOrThrow({ where: { id: goal.id } })
    expect(updated.status).toBe("COMPLETED")
  })

  it("rejects contribution when goal is not ACTIVE", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const goal = await createGoal(user.id, {
      targetAmount: dollars(100),
      status: "CANCELLED",
    })

    const result = await addContributionAction(
      { success: true, data: undefined },
      formData({
        goalId: goal.id,
        amount: "5000",
        date: "2026-04-01",
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GOAL_NOT_ACTIVE")
  })
})
