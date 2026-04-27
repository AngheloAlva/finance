import { describe, expect, it } from "vitest"
import { generateInstallmentRows } from "@/features/transactions/lib/installment.utils"

const baseInput = {
  description: "Laptop",
  notes: null,
  type: "EXPENSE" as const,
  paymentMethod: "CREDIT_CARD" as const,
  categoryId: "cat-1",
  userId: "user-1",
}

describe("generateInstallmentRows", () => {
  it("splits an evenly-divisible amount into equal installments", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 120000,
      totalInstallments: 6,
      date: new Date(2025, 10, 10),
    })

    expect(rows).toHaveLength(6)
    expect(rows.every((r) => r.amount === 20000)).toBe(true)
    const total = rows.reduce((sum, r) => sum + r.amount, 0)
    expect(total).toBe(120000)
  })

  it("puts the remainder of a non-divisible total on the last installment", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 1000,
      totalInstallments: 3,
      date: new Date(2025, 10, 10),
    })

    expect(rows.map((r) => r.amount)).toEqual([333, 333, 334])
    expect(rows.reduce((sum, r) => sum + r.amount, 0)).toBe(1000)
  })

  it("numbers installments sequentially and tags them with totalInstallments", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 600,
      totalInstallments: 3,
      date: new Date(2025, 10, 10),
    })

    expect(rows.map((r) => r.installmentNumber)).toEqual([1, 2, 3])
    expect(rows.every((r) => r.totalInstallments === 3)).toBe(true)
    expect(rows[0].description).toBe("Laptop (1/3)")
    expect(rows[2].description).toBe("Laptop (3/3)")
  })

  it("spaces non-credit-card impact dates by one month each, day capped at 28", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 600,
      totalInstallments: 4,
      date: new Date(2025, 10, 30),
    })

    expect(rows[0].impactDate.getMonth()).toBe(10)
    expect(rows[1].impactDate.getMonth()).toBe(11)
    expect(rows[2].impactDate.getMonth()).toBe(0)
    expect(rows[2].impactDate.getFullYear()).toBe(2026)
    expect(rows[3].impactDate.getMonth()).toBe(1)
    expect(rows.every((r) => r.impactDate.getDate() === 28)).toBe(true)
  })

  it("uses billing-cycle aware impact dates when a credit card is provided", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 600,
      totalInstallments: 3,
      date: new Date(2025, 10, 10),
      creditCardId: "card-1",
      closingDay: 20,
      paymentDay: 10,
    })

    expect(rows.every((r) => r.creditCardId === "card-1")).toBe(true)
    expect(rows[0].impactDate.getTime()).toBeLessThan(rows[1].impactDate.getTime())
    expect(rows[1].impactDate.getTime()).toBeLessThan(rows[2].impactDate.getTime())

    for (let i = 1; i < rows.length; i++) {
      const diffMs = rows[i].impactDate.getTime() - rows[i - 1].impactDate.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(25)
      expect(diffDays).toBeLessThan(35)
    }
  })

  it("falls back to plain monthly spacing when creditCardId is provided without billing days", () => {
    const rows = generateInstallmentRows({
      ...baseInput,
      totalAmount: 600,
      totalInstallments: 3,
      date: new Date(2025, 10, 10),
      creditCardId: "card-1",
    })

    expect(rows[0].impactDate.getMonth()).toBe(10)
    expect(rows[1].impactDate.getMonth()).toBe(11)
    expect(rows[2].impactDate.getMonth()).toBe(0)
  })
})
