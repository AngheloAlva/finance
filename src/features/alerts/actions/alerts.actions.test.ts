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

import { dismissAlertAction } from "@/features/alerts/actions/dismiss-alert.action"
import { markAlertReadAction } from "@/features/alerts/actions/mark-alert-read.action"
import { markAllReadAction } from "@/features/alerts/actions/mark-all-read.action"
import { prisma } from "@/shared/lib/prisma"
import { createUser } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

async function createAlert(userId: string, overrides: { status?: "PENDING" | "READ" | "DISMISSED" } = {}) {
  return prisma.alert.create({
    data: {
      type: "BUDGET_EXCEEDED",
      message: "test",
      severity: "WARNING",
      status: overrides.status ?? "PENDING",
      referenceType: "budget",
      referenceId: Math.random().toString(36).slice(2),
      deduplicationKey: Math.random().toString(36).slice(2),
      user: { connect: { id: userId } },
    },
  })
}

describe("dismissAlertAction", () => {
  it("sets the alert status to DISMISSED for the owner", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const alert = await createAlert(user.id)

    const result = await dismissAlertAction(
      { success: true, data: undefined },
      formData({ alertId: alert.id }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.alert.findUniqueOrThrow({ where: { id: alert.id } })
    expect(updated.status).toBe("DISMISSED")
  })

  it("returns ALERT_NOT_OWNED when alert belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const alert = await createAlert(owner.id)

    const result = await dismissAlertAction(
      { success: true, data: undefined },
      formData({ alertId: alert.id }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ALERT_NOT_OWNED")
  })

  it("returns ALERT_NOT_FOUND for a missing alertId", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await dismissAlertAction(
      { success: true, data: undefined },
      formData({ alertId: "non-existent" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ALERT_NOT_FOUND")
  })
})

describe("markAlertReadAction", () => {
  it("sets the alert status to READ for the owner", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const alert = await createAlert(user.id)

    const result = await markAlertReadAction(
      { success: true, data: undefined },
      formData({ alertId: alert.id }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.alert.findUniqueOrThrow({ where: { id: alert.id } })
    expect(updated.status).toBe("READ")
  })

  it("rejects another user's alert", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const alert = await createAlert(owner.id)

    const result = await markAlertReadAction(
      { success: true, data: undefined },
      formData({ alertId: alert.id }),
    )
    expect(result.success).toBe(false)
  })
})

describe("markAllReadAction", () => {
  it("marks all PENDING alerts of the user as READ and returns the count", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    await createAlert(user.id, { status: "PENDING" })
    await createAlert(user.id, { status: "PENDING" })
    await createAlert(user.id, { status: "DISMISSED" })

    const result = await markAllReadAction()

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.count).toBe(2)

    const remainingPending = await prisma.alert.count({
      where: { userId: user.id, status: "PENDING" },
    })
    expect(remainingPending).toBe(0)
  })

  it("does not touch other users' alerts", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    await createAlert(owner.id, { status: "PENDING" })

    await markAllReadAction()

    const ownerAlerts = await prisma.alert.findMany({ where: { userId: owner.id } })
    expect(ownerAlerts[0].status).toBe("PENDING")
  })
})
