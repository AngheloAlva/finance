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

import { createRuleAction } from "@/features/categorization/actions/create-rule.action"
import { updateRuleAction } from "@/features/categorization/actions/update-rule.action"
import { deleteRuleAction } from "@/features/categorization/actions/delete-rule.action"
import { learnFromTransactionAction } from "@/features/categorization/actions/learn-from-transaction.action"
import { suggestCategoryAction } from "@/features/categorization/actions/suggest-category.action"
import { prisma } from "@/shared/lib/prisma"
import { createCategory, createUser } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

async function createRule(
  userId: string,
  categoryId: string,
  overrides: { pattern?: string; matchType?: "EXACT" | "STARTS_WITH" | "CONTAINS" } = {},
) {
  return prisma.categorizationRule.create({
    data: {
      pattern: overrides.pattern ?? `pat-${Math.random().toString(36).slice(2, 8)}`,
      matchType: overrides.matchType ?? "CONTAINS",
      user: { connect: { id: userId } },
      category: { connect: { id: categoryId } },
    },
  })
}

describe("createRuleAction", () => {
  it("creates a rule lowercased and trimmed", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await createRuleAction(
      { success: true, data: undefined },
      formData({ pattern: "  Uber  ", matchType: "STARTS_WITH", categoryId: cat.id }),
    )

    expect(result.success).toBe(true)
    const rules = await prisma.categorizationRule.findMany({ where: { userId: user.id } })
    expect(rules[0].pattern).toBe("uber")
    expect(rules[0].matchType).toBe("STARTS_WITH")
  })

  it("returns RULE_ALREADY_EXISTS for a duplicate pattern", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    await createRule(user.id, cat.id, { pattern: "uber" })

    const result = await createRuleAction(
      { success: true, data: undefined },
      formData({ pattern: "Uber", categoryId: cat.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("RULE_ALREADY_EXISTS")
  })
})

describe("updateRuleAction", () => {
  it("updates the owner's rule", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const rule = await createRule(user.id, cat.id, { pattern: "old" })

    const result = await updateRuleAction(
      { success: true, data: undefined },
      formData({
        id: rule.id,
        pattern: "new",
        matchType: "EXACT",
        categoryId: cat.id,
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.categorizationRule.findUniqueOrThrow({ where: { id: rule.id } })
    expect(updated.pattern).toBe("new")
    expect(updated.matchType).toBe("EXACT")
  })

  it("rejects another user's rule", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)
    const otherCat = await createCategory(other.id)
    const rule = await createRule(owner.id, cat.id)

    const result = await updateRuleAction(
      { success: true, data: undefined },
      formData({
        id: rule.id,
        pattern: "hijack",
        matchType: "CONTAINS",
        categoryId: otherCat.id,
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("RULE_NOT_OWNED")
  })
})

describe("deleteRuleAction", () => {
  it("deletes the owner's rule", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const rule = await createRule(user.id, cat.id)

    const result = await deleteRuleAction(
      { success: true, data: undefined },
      formData({ id: rule.id }),
    )

    expect(result.success).toBe(true)
    expect(
      await prisma.categorizationRule.findUnique({ where: { id: rule.id } }),
    ).toBeNull()
  })
})

describe("learnFromTransactionAction", () => {
  it("creates a CONTAINS rule from a description with hitCount=1", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await learnFromTransactionAction("Netflix Subscription", cat.id)

    expect(result.success).toBe(true)
    const rule = await prisma.categorizationRule.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(rule.pattern).toBe("netflix subscription")
    expect(rule.hitCount).toBe(1)
    expect(rule.matchType).toBe("CONTAINS")
  })

  it("bumps hitCount when a rule with the same pattern already exists", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    await createRule(user.id, cat.id, { pattern: "spotify" })

    await learnFromTransactionAction("Spotify", cat.id)
    await learnFromTransactionAction("Spotify", cat.id)

    const rule = await prisma.categorizationRule.findFirstOrThrow({
      where: { userId: user.id, pattern: "spotify" },
    })
    expect(rule.hitCount).toBe(2)
  })
})

describe("suggestCategoryAction", () => {
  it("returns the matching rule's category for a description", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id, { name: "Streaming" })
    await createRule(user.id, cat.id, { pattern: "netflix", matchType: "CONTAINS" })

    const suggestion = await suggestCategoryAction("Netflix Plan")

    expect(suggestion).not.toBeNull()
    expect(suggestion?.categoryId).toBe(cat.id)
    expect(suggestion?.categoryName).toBe("Streaming")
  })

  it("returns null when no rule matches", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const suggestion = await suggestCategoryAction("Random thing")
    expect(suggestion).toBeNull()
  })
})
