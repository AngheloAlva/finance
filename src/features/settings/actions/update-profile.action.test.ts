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

import { updateProfileAction } from "@/features/settings/actions/update-profile.action"
import { prisma } from "@/shared/lib/prisma"
import { createUser } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("updateProfileAction", () => {
  it("updates the authenticated user's name, currency and timezone", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({
        name: "Renamed",
        currency: "USD",
        timezone: "UTC",
        image: "",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.name).toBe("Renamed")
    expect(updated.image).toBeNull()
  })

  it("returns VALIDATION_ERROR when name is too short", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({ name: "x", currency: "USD", timezone: "UTC" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("returns VALIDATION_ERROR for an unknown currency", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({ name: "Valid", currency: "XYZ", timezone: "UTC" }),
    )
    expect(result.success).toBe(false)
  })
})
