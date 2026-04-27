import { describe, expect, it } from "vitest"
import {
  getInvestmentById,
  getInvestmentWithSnapshots,
  getInvestments,
} from "@/features/investments/lib/investments.queries"
import {
  createInvestment,
  createInvestmentSnapshot,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

describe("getInvestments", () => {
  it("returns the user's investments sorted alphabetically", async () => {
    const user = await createUser()
    await createInvestment(user.id, {
      name: "Zeta",
      initialAmount: dollars(100),
      currentValue: dollars(150),
    })
    await createInvestment(user.id, {
      name: "Alpha",
      initialAmount: dollars(100),
      currentValue: dollars(200),
    })

    const list = await getInvestments(user.id)
    expect(list.map((i) => i.name)).toEqual(["Alpha", "Zeta"])
  })

  it("filters by type when provided", async () => {
    const user = await createUser()
    await createInvestment(user.id, {
      name: "Stock A",
      type: "STOCKS",
      initialAmount: 100,
      currentValue: 100,
    })
    await createInvestment(user.id, {
      name: "Crypto A",
      type: "CRYPTO",
      initialAmount: 100,
      currentValue: 100,
    })

    const stocks = await getInvestments(user.id, { type: "STOCKS" })
    expect(stocks.map((i) => i.name)).toEqual(["Stock A"])
  })

  it("does not leak investments from other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createInvestment(userA.id, { initialAmount: 100, currentValue: 100 })
    await createInvestment(userB.id, { initialAmount: 100, currentValue: 100 })

    const a = await getInvestments(userA.id)
    expect(a).toHaveLength(1)
  })
})

describe("getInvestmentById", () => {
  it("returns null for another user's investment", async () => {
    const owner = await createUser()
    const other = await createUser()
    const inv = await createInvestment(owner.id, {
      initialAmount: 100,
      currentValue: 100,
    })

    expect(await getInvestmentById(inv.id, other.id)).toBeNull()
  })
})

describe("getInvestmentWithSnapshots", () => {
  it("returns snapshots ordered by date asc", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(100),
      currentValue: dollars(120),
    })
    await createInvestmentSnapshot(inv.id, {
      date: new Date(2026, 1, 1),
      value: dollars(110),
    })
    await createInvestmentSnapshot(inv.id, {
      date: new Date(2026, 0, 1),
      value: dollars(105),
    })

    const result = await getInvestmentWithSnapshots(inv.id, user.id)
    expect(result?.snapshots).toHaveLength(2)
    expect(result?.snapshots[0].value).toBe(dollars(105))
    expect(result?.snapshots[1].value).toBe(dollars(110))
  })
})
