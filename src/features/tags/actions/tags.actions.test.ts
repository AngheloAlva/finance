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

import { createTagAction } from "@/features/tags/actions/create-tag.action"
import { updateTagAction } from "@/features/tags/actions/update-tag.action"
import { deleteTagAction } from "@/features/tags/actions/delete-tag.action"
import { prisma } from "@/shared/lib/prisma"
import { createTag, createUser } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createTagAction", () => {
  it("creates a tag with the provided name and color", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createTagAction(
      { success: true, data: undefined },
      formData({ name: "groceries", color: "#ff0000" }),
    )

    expect(result.success).toBe(true)
    const tags = await prisma.tag.findMany({ where: { userId: user.id } })
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe("groceries")
    expect(tags[0].color).toBe("#ff0000")
  })

  it("returns TAG_ALREADY_EXISTS on duplicate name for the same user", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    await createTag(user.id, { name: "dup" })

    const result = await createTagAction(
      { success: true, data: undefined },
      formData({ name: "dup", color: "#000000" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TAG_ALREADY_EXISTS")
  })

  it("returns VALIDATION_ERROR for an invalid color format", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createTagAction(
      { success: true, data: undefined },
      formData({ name: "ok", color: "not-a-color" }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })
})

describe("updateTagAction", () => {
  it("updates the tag name and color for the owner", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tag = await createTag(user.id, { name: "old" })

    const result = await updateTagAction(
      { success: true, data: undefined },
      formData({ id: tag.id, name: "new", color: "#abcdef" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.tag.findUniqueOrThrow({ where: { id: tag.id } })
    expect(updated.name).toBe("new")
    expect(updated.color).toBe("#abcdef")
  })

  it("returns TAG_NOT_OWNED when tag belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const tag = await createTag(owner.id)

    const result = await updateTagAction(
      { success: true, data: undefined },
      formData({ id: tag.id, name: "hijack", color: "#abcdef" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TAG_NOT_OWNED")
  })
})

describe("deleteTagAction", () => {
  it("deletes the owner's tag", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tag = await createTag(user.id)

    const result = await deleteTagAction(
      { success: true, data: undefined },
      formData({ id: tag.id }),
    )

    expect(result.success).toBe(true)
    expect(await prisma.tag.findUnique({ where: { id: tag.id } })).toBeNull()
  })

  it("returns TAG_NOT_OWNED when tag belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const tag = await createTag(owner.id)

    const result = await deleteTagAction(
      { success: true, data: undefined },
      formData({ id: tag.id }),
    )
    expect(result.success).toBe(false)
  })
})
