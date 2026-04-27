import { describe, expect, it } from "vitest"
import {
  findMatchingRule,
  ruleMatches,
} from "@/features/categorization/lib/categorization.engine"
import type { MatchType } from "@/generated/prisma/enums"

function rule(pattern: string, matchType: MatchType, isActive = true) {
  return { pattern, matchType, isActive }
}

describe("ruleMatches", () => {
  it("EXACT only matches when target equals pattern (case-insensitive)", () => {
    expect(ruleMatches(rule("Uber", "EXACT"), "uber")).toBe(true)
    expect(ruleMatches(rule("Uber", "EXACT"), "Uber Eats")).toBe(false)
  })

  it("STARTS_WITH matches a prefix, case-insensitive", () => {
    expect(ruleMatches(rule("Uber", "STARTS_WITH"), "uber eats - lunch")).toBe(true)
    expect(ruleMatches(rule("Eats", "STARTS_WITH"), "Uber Eats")).toBe(false)
  })

  it("CONTAINS matches anywhere in the target", () => {
    expect(ruleMatches(rule("market", "CONTAINS"), "Whole Foods Market - groceries")).toBe(true)
    expect(ruleMatches(rule("zzz", "CONTAINS"), "Whole Foods")).toBe(false)
  })

  it("trims whitespace from both pattern and target", () => {
    expect(ruleMatches(rule("  Uber  ", "EXACT"), "  uber  ")).toBe(true)
  })

  it("returns false when rule is inactive", () => {
    expect(ruleMatches(rule("Uber", "EXACT", false), "Uber")).toBe(false)
  })

  it("returns false for empty pattern or empty target", () => {
    expect(ruleMatches(rule("", "CONTAINS"), "anything")).toBe(false)
    expect(ruleMatches(rule("Uber", "CONTAINS"), "")).toBe(false)
  })
})

describe("findMatchingRule", () => {
  it("returns the first matching rule (caller controls order)", () => {
    const rules = [
      { id: "a", pattern: "Uber Eats", matchType: "CONTAINS" as const, isActive: true },
      { id: "b", pattern: "Uber", matchType: "STARTS_WITH" as const, isActive: true },
    ]
    const match = findMatchingRule(rules, "Uber Eats - lunch")
    expect(match?.id).toBe("a")
  })

  it("skips inactive rules and returns the next match", () => {
    const rules = [
      { id: "a", pattern: "Uber", matchType: "EXACT" as const, isActive: false },
      { id: "b", pattern: "uber", matchType: "STARTS_WITH" as const, isActive: true },
    ]
    expect(findMatchingRule(rules, "Uber")?.id).toBe("b")
  })

  it("returns null when no rule matches", () => {
    const rules = [
      { id: "a", pattern: "Netflix", matchType: "CONTAINS" as const, isActive: true },
    ]
    expect(findMatchingRule(rules, "Spotify subscription")).toBeNull()
  })
})
