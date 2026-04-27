import { describe, expect, it } from "vitest"
import { getUserAlerts } from "@/features/alerts/lib/alerts.queries"
import { prisma } from "@/shared/lib/prisma"
import { createUser } from "../../../../tests/helpers/factories"

async function createAlert(
  userId: string,
  overrides: Partial<{
    type:
      | "BUDGET_EXCEEDED"
      | "BUDGET_WARNING"
      | "GOAL_MILESTONE"
      | "CATEGORY_THRESHOLD_EXCEEDED"
    status: "PENDING" | "READ" | "DISMISSED"
    referenceId: string
    deduplicationKey: string
    message: string
  }> = {},
) {
  return prisma.alert.create({
    data: {
      type: overrides.type ?? "BUDGET_EXCEEDED",
      message: overrides.message ?? "test alert",
      severity: "WARNING",
      status: overrides.status ?? "PENDING",
      referenceType: "budget",
      referenceId: overrides.referenceId ?? Math.random().toString(36).slice(2),
      deduplicationKey: overrides.deduplicationKey ?? Math.random().toString(36).slice(2),
      user: { connect: { id: userId } },
    },
  })
}

describe("getUserAlerts", () => {
  it("returns empty paginated result for users with no alerts", async () => {
    const user = await createUser()

    const result = await getUserAlerts(user.id, { page: 1, pageSize: 20 })

    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })

  it("filters by status when provided", async () => {
    const user = await createUser()
    await createAlert(user.id, { status: "PENDING" })
    await createAlert(user.id, { status: "READ" })
    await createAlert(user.id, { status: "DISMISSED" })

    const pending = await getUserAlerts(user.id, {
      status: "PENDING",
      page: 1,
      pageSize: 20,
    })

    expect(pending.data).toHaveLength(1)
    expect(pending.total).toBe(1)
  })

  it("paginates results by createdAt desc", async () => {
    const user = await createUser()
    for (let i = 0; i < 5; i++) {
      await createAlert(user.id, { message: `alert-${i}` })
    }

    const page1 = await getUserAlerts(user.id, { page: 1, pageSize: 2 })
    const page2 = await getUserAlerts(user.id, { page: 2, pageSize: 2 })

    expect(page1.data).toHaveLength(2)
    expect(page2.data).toHaveLength(2)
    expect(page1.totalPages).toBe(3)
    expect(page1.total).toBe(5)
    // No overlap
    const ids1 = page1.data.map((a) => a.id)
    const ids2 = page2.data.map((a) => a.id)
    expect(ids1.some((id) => ids2.includes(id))).toBe(false)
  })

  it("does not leak alerts from other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createAlert(userA.id)
    await createAlert(userB.id)

    const aResult = await getUserAlerts(userA.id, { page: 1, pageSize: 20 })

    expect(aResult.total).toBe(1)
  })
})
