import { describe, expect, it } from "vitest"
import {
  assertCategoryAccess,
  getCategoryById,
  getUserCategories,
} from "@/features/categories/lib/categories.queries"
import { createCategory, createUser } from "../../../../tests/helpers/factories"

describe("getUserCategories", () => {
  it("includes SYSTEM categories along with the user's own", async () => {
    const user = await createUser()
    await createCategory(user.id, { name: "Food", scope: "USER" })
    await createCategory(null, { name: "System Travel", scope: "SYSTEM" })

    const cats = await getUserCategories(user.id)

    const names = cats.map((c) => c.name)
    expect(names).toContain("Food")
    expect(names).toContain("System Travel")
  })

  it("does not leak USER categories from another user", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createCategory(userA.id, { name: "A-Only", scope: "USER" })
    await createCategory(userB.id, { name: "B-Only", scope: "USER" })

    const cats = await getUserCategories(userA.id)

    expect(cats.map((c) => c.name)).toContain("A-Only")
    expect(cats.map((c) => c.name)).not.toContain("B-Only")
  })
})

describe("getCategoryById", () => {
  it("returns null for an unknown id", async () => {
    expect(await getCategoryById("does-not-exist")).toBeNull()
  })

  it("returns the category with children included", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { name: "Parent" })

    const result = await getCategoryById(cat.id)

    expect(result?.id).toBe(cat.id)
    expect(result?.children).toEqual([])
  })
})

describe("assertCategoryAccess", () => {
  it("returns CATEGORY_NOT_FOUND for an unknown id", async () => {
    const user = await createUser()
    const result = await assertCategoryAccess("nope", user.id)
    expect(result).toEqual({ success: false, error: "CATEGORY_NOT_FOUND" })
  })

  it("returns CATEGORY_ACCESS_DENIED when category belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    const cat = await createCategory(owner.id)

    const result = await assertCategoryAccess(cat.id, other.id)
    expect(result).toEqual({ success: false, error: "CATEGORY_ACCESS_DENIED" })
  })

  it("returns success for SYSTEM categories regardless of user", async () => {
    const user = await createUser()
    const cat = await createCategory(null, { scope: "SYSTEM" })

    const result = await assertCategoryAccess(cat.id, user.id)
    expect(result.success).toBe(true)
  })

  it("returns success for the owner of a USER category", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)

    const result = await assertCategoryAccess(cat.id, user.id)
    expect(result.success).toBe(true)
  })
})
