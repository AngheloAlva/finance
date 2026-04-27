import { describe, expect, it } from "vitest"
import {
  getCreditCardById,
  getCreditCardUsage,
  getCreditCardWithTransactions,
  getCreditCards,
} from "@/features/credit-cards/lib/credit-cards.queries"
import { getCurrentCycleRange } from "@/features/credit-cards/lib/billing-cycle.utils"
import {
  createCreditCard,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

describe("getCreditCards", () => {
  it("returns cards sorted by name with usage attached", async () => {
    const user = await createUser()
    await createCreditCard(user.id, { name: "Zeta", totalLimit: dollars(1000) })
    await createCreditCard(user.id, { name: "Alpha", totalLimit: dollars(2000) })

    const cards = await getCreditCards(user.id)

    expect(cards.map((c) => c.name)).toEqual(["Alpha", "Zeta"])
    expect(cards.every((c) => "usedLimit" in c && "availableLimit" in c)).toBe(true)
  })

  it("isolates cards per user", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createCreditCard(userA.id)
    await createCreditCard(userB.id)

    const cards = await getCreditCards(userA.id)
    expect(cards).toHaveLength(1)
  })
})

describe("getCreditCardById", () => {
  it("returns null when the card belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    const card = await createCreditCard(owner.id)

    expect(await getCreditCardById(card.id, other.id)).toBeNull()
  })

  it("returns the card for the owner", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id)

    const found = await getCreditCardById(card.id, user.id)
    expect(found?.id).toBe(card.id)
  })
})

describe("getCreditCardUsage", () => {
  it("aggregates EXPENSE transactions in current cycle and computes available", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
      totalLimit: dollars(1000),
    })
    const { start } = getCurrentCycleRange(20, 10)
    const insideCycle = new Date(start.getTime() + 24 * 60 * 60 * 1000)

    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(300),
      creditCardId: card.id,
      date: insideCycle,
    })

    const usage = await getCreditCardUsage(card.id, 20, 10, dollars(1000))

    expect(usage.used).toBe(dollars(300))
    expect(usage.available).toBe(dollars(700))
    expect(usage.total).toBe(dollars(1000))
  })

  it("ignores templates and INCOME", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
      totalLimit: dollars(1000),
    })
    const { start } = getCurrentCycleRange(20, 10)
    const insideCycle = new Date(start.getTime() + 24 * 60 * 60 * 1000)

    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(500),
      creditCardId: card.id,
      date: insideCycle,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      creditCardId: card.id,
      date: insideCycle,
      isTemplate: true,
    })

    const usage = await getCreditCardUsage(card.id, 20, 10, dollars(1000))
    expect(usage.used).toBe(0)
  })
})

describe("getCreditCardWithTransactions", () => {
  it("returns null when card belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    const card = await createCreditCard(owner.id)

    expect(await getCreditCardWithTransactions(card.id, other.id)).toBeNull()
  })

  it("returns transactions for the explicit cycle window", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, { totalLimit: dollars(1000) })
    const cycleStart = new Date(2026, 0, 1)
    const cycleEnd = new Date(2026, 0, 31)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      creditCardId: card.id,
      date: new Date(2026, 0, 15),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(99999),
      creditCardId: card.id,
      date: new Date(2025, 5, 1), // outside cycle
    })

    const result = await getCreditCardWithTransactions(
      card.id,
      user.id,
      cycleStart,
      cycleEnd,
    )

    expect(result?.transactions).toHaveLength(1)
    expect(result?.usedLimit).toBe(dollars(100))
  })
})
