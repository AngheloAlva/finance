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
  it("updates the authenticated user's name", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({
        name: "Renamed",
        image: "",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.name).toBe("Renamed")
    expect(updated.image).toBeNull()
  })

  it("keeps the stored avatar when the form has no image field", async () => {
    const user = await createUser()
    await prisma.user.update({
      where: { id: user.id },
      data: { image: "https://example.com/me.png" },
    })
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({ name: "Renamed" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.image).toBe("https://example.com/me.png")
  })

  it("returns VALIDATION_ERROR when name is too short", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({ name: "x" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("ignores a submitted currency and time zone", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const before = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })

    const result = await updateProfileAction(
      { success: true, data: undefined },
      formData({ name: "Valid", currency: "XYZ", timezone: "Mars/Olympus_Mons" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.currency).toBe(before.currency)
    expect(updated.timezone).toBe(before.timezone)
  })
})
