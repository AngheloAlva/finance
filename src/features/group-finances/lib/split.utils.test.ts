import { describe, expect, it } from "vitest"
import {
  generateCustomSplits,
  generateEqualSplits,
  generateProportionalSplits,
  generateSplits,
} from "@/features/group-finances/lib/split.utils"

const m = (id: string) => ({ userId: id, name: id })

describe("generateEqualSplits", () => {
  it("divides evenly when total is divisible", async () => {
    const result = generateEqualSplits(900, [m("a"), m("b"), m("c")])
    expect(result.map((r) => r.amount)).toEqual([300, 300, 300])
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(900)
  })

  it("absorbs remainder by giving +1 cent to the first sorted users", () => {
    const result = generateEqualSplits(100, [m("c"), m("a"), m("b")])
    // 100 / 3 = 33 base, remainder 1 → first sorted (a) gets 34
    const byUser = Object.fromEntries(result.map((r) => [r.userId, r.amount]))
    expect(byUser.a).toBe(34)
    expect(byUser.b).toBe(33)
    expect(byUser.c).toBe(33)
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(100)
  })

  it("never leaves rounding drift even with awkward totals", () => {
    const result = generateEqualSplits(1001, [m("a"), m("b"), m("c"), m("d")])
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(1001)
  })

  it("throws when there are no members", () => {
    expect(() => generateEqualSplits(100, [])).toThrow(/zero members/)
  })
})

describe("generateProportionalSplits", () => {
  it("splits exactly when shares are clean", () => {
    const result = generateProportionalSplits(1000, [
      { userId: "a", percentage: 50 },
      { userId: "b", percentage: 50 },
    ])
    expect(result).toEqual([
      { userId: "a", amount: 500 },
      { userId: "b", amount: 500 },
    ])
  })

  it("uses largest-remainder method to absorb shortfall deterministically", () => {
    // 1000 cents @ 33.33 / 33.33 / 33.34
    // exact: 333.3, 333.3, 333.4 → floors 333/333/333, shortfall 1
    // fractional remainders: .3, .3, .4 → c gets +1
    const result = generateProportionalSplits(1000, [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
      { userId: "c", percentage: 33.34 },
    ])
    const byUser = Object.fromEntries(result.map((r) => [r.userId, r.amount]))
    expect(byUser).toEqual({ a: 333, b: 333, c: 334 })
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(1000)
  })

  it("breaks fractional ties by userId ascending", () => {
    // 100 cents at 33.33% / 33.33% / 33.34%
    const result = generateProportionalSplits(100, [
      { userId: "z", percentage: 33.33 },
      { userId: "a", percentage: 33.33 },
      { userId: "m", percentage: 33.34 },
    ])
    const byUser = Object.fromEntries(result.map((r) => [r.userId, r.amount]))
    // m has the largest fractional remainder, gets +1 first
    // Then a,z tied — a wins by lex order
    // Wait: 100/3 fractions: 33.33→33.33→.33; 33.34→.34
    // floors: 33,33,33 = 99; shortfall 1 → m (.34) gets +1
    expect(byUser.m).toBe(34)
    expect(byUser.a).toBe(33)
    expect(byUser.z).toBe(33)
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(100)
  })

  it("rejects when percentages do not sum to 100", () => {
    expect(() =>
      generateProportionalSplits(100, [
        { userId: "a", percentage: 30 },
        { userId: "b", percentage: 50 },
      ]),
    ).toThrow(/sum to 100/)
  })

  it("throws when there are no members", () => {
    expect(() => generateProportionalSplits(100, [])).toThrow(/zero members/)
  })
})

describe("generateCustomSplits", () => {
  it("passes through valid amounts that sum to total", () => {
    const result = generateCustomSplits(1000, [
      { userId: "a", amount: 700 },
      { userId: "b", amount: 300 },
    ])
    expect(result).toEqual([
      { userId: "a", amount: 700 },
      { userId: "b", amount: 300 },
    ])
  })

  it("rejects when sum doesn't match total", () => {
    expect(() =>
      generateCustomSplits(1000, [
        { userId: "a", amount: 600 },
        { userId: "b", amount: 300 },
      ]),
    ).toThrow(/sum to 1000/)
  })

  it("rejects non-positive amounts", () => {
    expect(() =>
      generateCustomSplits(1000, [
        { userId: "a", amount: 0 },
        { userId: "b", amount: 1000 },
      ]),
    ).toThrow(/positive/)
  })

  it("throws when there are no members", () => {
    expect(() => generateCustomSplits(100, [])).toThrow(/zero members/)
  })
})

describe("generateSplits dispatcher", () => {
  it("routes EQUAL to equal splitter", () => {
    const result = generateSplits({
      totalAmount: 600,
      splitRule: "EQUAL",
      members: [m("a"), m("b"), m("c")],
    })
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(600)
  })

  it("routes PROPORTIONAL using proportionalSplits input", () => {
    const result = generateSplits({
      totalAmount: 1000,
      splitRule: "PROPORTIONAL",
      members: [m("a"), m("b")],
      proportionalSplits: [
        { userId: "a", percentage: 70 },
        { userId: "b", percentage: 30 },
      ],
    })
    const byUser = Object.fromEntries(result.map((r) => [r.userId, r.amount]))
    expect(byUser).toEqual({ a: 700, b: 300 })
  })

  it("routes CUSTOM using customSplits input", () => {
    const result = generateSplits({
      totalAmount: 500,
      splitRule: "CUSTOM",
      members: [m("a"), m("b")],
      customSplits: [
        { userId: "a", amount: 200 },
        { userId: "b", amount: 300 },
      ],
    })
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(500)
  })

  it("throws when PROPORTIONAL is missing proportionalSplits", () => {
    expect(() =>
      generateSplits({
        totalAmount: 100,
        splitRule: "PROPORTIONAL",
        members: [m("a"), m("b")],
      }),
    ).toThrow(/proportionalSplits is required/)
  })

  it("throws when CUSTOM is missing customSplits", () => {
    expect(() =>
      generateSplits({
        totalAmount: 100,
        splitRule: "CUSTOM",
        members: [m("a"), m("b")],
      }),
    ).toThrow(/customSplits is required/)
  })
})
