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

import { createCreditCardAction } from "@/features/credit-cards/actions/create-credit-card.action"
import { updateCreditCardAction } from "@/features/credit-cards/actions/update-credit-card.action"
import { deleteCreditCardAction } from "@/features/credit-cards/actions/delete-credit-card.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createCreditCard,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

const baseCardFields = {
  name: "Visa Gold",
  lastFourDigits: "4242",
  brand: "VISA",
  totalLimit: "1000000",
  closingDay: "20",
  paymentDay: "10",
  color: "#000000",
}

describe("createCreditCardAction", () => {
  it("creates a credit card for the session user", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createCreditCardAction(
      { success: true, data: undefined },
      formData(baseCardFields),
    )

    expect(result.success).toBe(true)
    const cards = await prisma.creditCard.findMany({ where: { userId: user.id } })
    expect(cards).toHaveLength(1)
    expect(cards[0].name).toBe("Visa Gold")
  })

  it("returns VALIDATION_ERROR for an invalid lastFourDigits", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createCreditCardAction(
      { success: true, data: undefined },
      formData({ ...baseCardFields, lastFourDigits: "12" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })
})

describe("updateCreditCardAction", () => {
  it("updates the owner's card fields", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const card = await createCreditCard(user.id)

    const result = await updateCreditCardAction(
      { success: true, data: undefined },
      formData({ ...baseCardFields, id: card.id, name: "Renamed" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.creditCard.findUniqueOrThrow({ where: { id: card.id } })
    expect(updated.name).toBe("Renamed")
  })

  it("rejects updates to another user's card", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const card = await createCreditCard(owner.id)

    const result = await updateCreditCardAction(
      { success: true, data: undefined },
      formData({ ...baseCardFields, id: card.id, name: "Hijack" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CREDIT_CARD_NOT_OWNED")
  })
})

describe("deleteCreditCardAction", () => {
  it("deletes a card with no linked transactions", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const card = await createCreditCard(user.id)

    const result = await deleteCreditCardAction(
      { success: true, data: undefined },
      formData({ id: card.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.creditCard.findUnique({ where: { id: card.id } })).toBeNull()
  })

  it("blocks deletion when card has linked transactions", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const card = await createCreditCard(user.id)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      creditCardId: card.id,
    })

    const result = await deleteCreditCardAction(
      { success: true, data: undefined },
      formData({ id: card.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CREDIT_CARD_DELETE_HAS_TRANSACTIONS")
  })
})
