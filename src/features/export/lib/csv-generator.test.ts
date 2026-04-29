import { describe, expect, it } from "vitest"
import { generateTransactionsCsv } from "@/features/export/lib/csv-generator"
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types"

const HEADERS =
  "Date,Description,Amount,Type,Category,Payment Method,Credit Card,Tags,Notes"

function makeTx(overrides: Partial<TransactionWithCategory> = {}): TransactionWithCategory {
  return {
    id: "tx-1",
    userId: "user-1",
    groupId: null,
    description: "Coffee",
    amount: 1234,
    type: "EXPENSE",
    paymentMethod: "CASH",
    date: new Date("2026-04-15T12:00:00Z"),
    impactDate: new Date("2026-04-15T12:00:00Z"),
    isTemplate: false,
    notes: null,
    categoryId: "cat-1",
    creditCardId: null,
    parentTransactionId: null,
    totalInstallments: null,
    installmentNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-1", name: "Food", icon: "fork", color: "#fff" },
    creditCard: null,
    tags: [],
    ...overrides,
  } as TransactionWithCategory
}

describe("generateTransactionsCsv", () => {
  it("returns just headers when no transactions", () => {
    const csv = generateTransactionsCsv([], "USD")
    expect(csv).toBe(HEADERS)
  })

  it("emits a header line followed by one row per transaction", () => {
    const csv = generateTransactionsCsv([makeTx()], "USD")
    const lines = csv.split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(HEADERS)
    expect(lines[1]).toContain("2026-04-15")
    expect(lines[1]).toContain("Coffee")
    expect(lines[1]).toContain("12.34")
    expect(lines[1]).toContain("EXPENSE")
    expect(lines[1]).toContain("Food")
  })

  it("formats amount as decimal cents based on currency (zero-decimal preserves integer)", () => {
    const usd = generateTransactionsCsv([makeTx({ amount: 5000 })], "USD")
    expect(usd.split("\n")[1]).toContain(",50.00,")

    const jpy = generateTransactionsCsv([makeTx({ amount: 5000 })], "JPY")
    expect(jpy.split("\n")[1]).toContain(",5000,")
  })

  it("escapes fields with commas, quotes or newlines", () => {
    const tx = makeTx({
      description: 'Tea, hot "extra"',
      notes: "line1\nline2",
    })
    const csv = generateTransactionsCsv([tx], "USD")
    expect(csv).toContain('"Tea, hot ""extra"""')
    expect(csv).toContain('"line1\nline2"')
  })

  it("joins tag names with semicolons", () => {
    const tx = makeTx({
      tags: [
        { tag: { id: "t1", name: "trip", color: "#000" } },
        { tag: { id: "t2", name: "reembolsable", color: "#fff" } },
      ],
    })
    const row = generateTransactionsCsv([tx], "USD").split("\n")[1]
    expect(row).toContain("trip; reembolsable")
  })

  it("renders the credit card label as 'Name *last4' when present", () => {
    const tx = makeTx({
      creditCard: { name: "Visa Gold", lastFourDigits: "4242", color: "#000" },
    })
    const row = generateTransactionsCsv([tx], "USD").split("\n")[1]
    expect(row).toContain("Visa Gold *4242")
  })

  it("leaves credit card and notes columns empty when missing", () => {
    const tx = makeTx({ description: "plain" })
    const row = generateTransactionsCsv([tx], "USD").split("\n")[1]
    // Trailing fields: ...,paymentMethod,,, (empty creditCard, tags, notes)
    expect(row.endsWith(",CASH,,,")).toBe(true)
  })

  it("renders dates in ISO YYYY-MM-DD format", () => {
    const tx = makeTx({ date: new Date("2026-01-05T23:30:00Z") })
    const row = generateTransactionsCsv([tx], "USD").split("\n")[1]
    expect(row.startsWith("2026-01-05,")).toBe(true)
  })
})
