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

import { createCategoryAction } from "@/features/categories/actions/create-category.action"
import { updateCategoryAction } from "@/features/categories/actions/update-category.action"
import { deleteCategoryAction } from "@/features/categories/actions/delete-category.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

const baseCategoryFields = {
  name: "Food",
  icon: "fork",
  color: "#ff0000",
  transactionType: "EXPENSE",
  isRecurring: "false",
  isAvoidable: "false",
  currencyCode: "USD",
}

describe("createCategoryAction", () => {
  it("creates a USER-scope category for the session user", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createCategoryAction(
      { success: true, data: undefined },
      formData(baseCategoryFields),
    )

    expect(result.success).toBe(true)
    const cats = await prisma.category.findMany({ where: { userId: user.id } })
    expect(cats).toHaveLength(1)
    expect(cats[0].scope).toBe("USER")
    expect(cats[0].name).toBe("Food")
  })

  it("returns CATEGORY_NESTING_TOO_DEEP when parent already has a parent", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const grand = await createCategory(user.id, { name: "Grand" })
    const parent = await prisma.category.create({
      data: {
        name: "Parent",
        icon: "x",
        color: "#000000",
        parent: { connect: { id: grand.id } },
        user: { connect: { id: user.id } },
      },
    })

    const result = await createCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseCategoryFields, name: "Child", parentId: parent.id }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_NESTING_TOO_DEEP")
  })
})

describe("updateCategoryAction", () => {
  it("updates the owner's category fields", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await updateCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseCategoryFields, id: cat.id, name: "Renamed" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.category.findUniqueOrThrow({ where: { id: cat.id } })
    expect(updated.name).toBe("Renamed")
  })

  it("rejects updates to SYSTEM categories", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(null, { scope: "SYSTEM" })

    const result = await updateCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseCategoryFields, id: cat.id, name: "Hijack" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_SYSTEM_IMMUTABLE")
  })

  it("rejects updates to another user's category", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)

    const result = await updateCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseCategoryFields, id: cat.id, name: "Steal" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_NOT_OWNED")
  })
})

describe("deleteCategoryAction", () => {
  it("deletes an owned empty category", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await deleteCategoryAction(
      { success: true, data: undefined },
      formData({ id: cat.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.category.findUnique({ where: { id: cat.id } })).toBeNull()
  })

  it("blocks deletion when the category has transactions", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      categoryId: cat.id,
    })

    const result = await deleteCategoryAction(
      { success: true, data: undefined },
      formData({ id: cat.id }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_DELETE_HAS_TRANSACTIONS")
  })

  it("blocks deletion of SYSTEM categories", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(null, { scope: "SYSTEM" })

    const result = await deleteCategoryAction(
      { success: true, data: undefined },
      formData({ id: cat.id }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_DELETE_SYSTEM")
  })
})
