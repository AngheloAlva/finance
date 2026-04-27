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

import { updateDashboardConfigAction } from "@/features/dashboard/actions/update-dashboard-config.action"
import { DEFAULT_DASHBOARD_CONFIG } from "@/features/dashboard/lib/dashboard.schema"
import { prisma } from "@/shared/lib/prisma"
import { createUser } from "../../../../tests/helpers/factories"
import { setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("updateDashboardConfigAction", () => {
  it("persists the dashboard config to the user record", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateDashboardConfigAction(DEFAULT_DASHBOARD_CONFIG)

    expect(result.success).toBe(true)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.dashboardConfig).toEqual(DEFAULT_DASHBOARD_CONFIG)
  })

  it("returns DASHBOARD_CONFIG_INVALID when shape is wrong", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    // @ts-expect-error — intentionally invalid
    const result = await updateDashboardConfigAction({ widgets: [{ key: "garbage" }] })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DASHBOARD_CONFIG_INVALID")
  })
})
