import { describe, expect, it } from "vitest"
import {
  getActiveRulesForMatching,
  getUserRules,
} from "@/features/categorization/lib/categorization.queries"
import { prisma } from "@/shared/lib/prisma"
import { createCategory, createUser } from "../../../../tests/helpers/factories"

async function createRule(
  userId: string,
  categoryId: string,
  overrides: Partial<{
    pattern: string
    matchType: "EXACT" | "STARTS_WITH" | "CONTAINS"
    hitCount: number
    isActive: boolean
  }> = {},
) {
  return prisma.categorizationRule.create({
    data: {
      pattern: overrides.pattern ?? `pat-${Math.random().toString(36).slice(2, 8)}`,
      matchType: overrides.matchType ?? "CONTAINS",
      hitCount: overrides.hitCount ?? 0,
      isActive: overrides.isActive ?? true,
      user: { connect: { id: userId } },
      category: { connect: { id: categoryId } },
    },
  })
}

describe("getUserRules", () => {
  it("returns all rules of the user (including inactive) sorted by hitCount desc", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createRule(user.id, cat.id, { pattern: "low", hitCount: 1 })
    await createRule(user.id, cat.id, { pattern: "high", hitCount: 50 })
    await createRule(user.id, cat.id, { pattern: "off", hitCount: 999, isActive: false })

    const rules = await getUserRules(user.id)

    expect(rules.map((r) => r.pattern)).toEqual(["off", "high", "low"])
    expect(rules.find((r) => r.pattern === "off")?.isActive).toBe(false)
  })

  it("does not leak rules from other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    const catA = await createCategory(userA.id)
    const catB = await createCategory(userB.id)
    await createRule(userA.id, catA.id, { pattern: "a" })
    await createRule(userB.id, catB.id, { pattern: "b" })

    const rules = await getUserRules(userA.id)

    expect(rules).toHaveLength(1)
    expect(rules[0].pattern).toBe("a")
  })
})

describe("getActiveRulesForMatching", () => {
  it("returns only active rules sorted by hitCount desc", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createRule(user.id, cat.id, { pattern: "active-low", hitCount: 1 })
    await createRule(user.id, cat.id, { pattern: "active-high", hitCount: 100 })
    await createRule(user.id, cat.id, { pattern: "off", hitCount: 999, isActive: false })

    const rules = await getActiveRulesForMatching(user.id)

    expect(rules.map((r) => r.pattern)).toEqual(["active-high", "active-low"])
  })
})
