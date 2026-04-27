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

import { createInvestmentAction } from "@/features/investments/actions/create-investment.action"
import { updateInvestmentAction } from "@/features/investments/actions/update-investment.action"
import { updateInvestmentValueAction } from "@/features/investments/actions/update-investment-value.action"
import { deleteInvestmentAction } from "@/features/investments/actions/delete-investment.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createInvestment,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import {
  expectRedirect,
  formData,
  setSessionUser,
} from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

const baseInvestmentFields = {
  type: "STOCKS",
  name: "Apple",
  institution: "Brokerage X",
  initialAmount: "100000",
  currency: "USD",
  startDate: "2026-01-01",
}

describe("createInvestmentAction", () => {
  it("creates an investment with currentValue equal to initialAmount", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createInvestmentAction(
      { success: true, data: undefined },
      formData(baseInvestmentFields),
    )

    expect(result.success).toBe(true)
    const list = await prisma.investment.findMany({ where: { userId: user.id } })
    expect(list).toHaveLength(1)
    expect(list[0].initialAmount).toBe(100000)
    expect(list[0].currentValue).toBe(100000)
  })

  it("returns VALIDATION_ERROR for negative initialAmount", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createInvestmentAction(
      { success: true, data: undefined },
      formData({ ...baseInvestmentFields, initialAmount: "-100" }),
    )
    expect(result.success).toBe(false)
  })
})

describe("updateInvestmentAction", () => {
  it("updates the owner's investment", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(100),
      currentValue: dollars(100),
    })

    const result = await updateInvestmentAction(
      { success: true, data: undefined },
      formData({
        ...baseInvestmentFields,
        id: inv.id,
        name: "Renamed",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.investment.findUniqueOrThrow({ where: { id: inv.id } })
    expect(updated.name).toBe("Renamed")
  })

  it("rejects another user's investment", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const inv = await createInvestment(owner.id, {
      initialAmount: dollars(100),
      currentValue: dollars(100),
    })

    const result = await updateInvestmentAction(
      { success: true, data: undefined },
      formData({ ...baseInvestmentFields, id: inv.id, name: "Hijack" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("INVESTMENT_NOT_OWNED")
  })
})

describe("updateInvestmentValueAction", () => {
  it("creates a snapshot of the OLD value and updates currentValue", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1000),
    })

    const result = await updateInvestmentValueAction(
      { success: true, data: undefined },
      formData({ id: inv.id, currentValue: "150000" }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.investment.findUniqueOrThrow({ where: { id: inv.id } })
    expect(updated.currentValue).toBe(150000)

    const snapshots = await prisma.investmentSnapshot.findMany({
      where: { investmentId: inv.id },
    })
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].value).toBe(dollars(1000))
  })

  it("is a no-op when newValue equals current value", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1000),
    })

    const result = await updateInvestmentValueAction(
      { success: true, data: undefined },
      formData({ id: inv.id, currentValue: String(dollars(1000)) }),
    )
    expect(result.success).toBe(true)

    const snapshots = await prisma.investmentSnapshot.count({
      where: { investmentId: inv.id },
    })
    expect(snapshots).toBe(0)
  })
})

describe("deleteInvestmentAction", () => {
  it("deletes the investment and redirects to /investments on success", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(100),
      currentValue: dollars(100),
    })

    await expectRedirect(
      deleteInvestmentAction(
        { success: true, data: undefined },
        formData({ id: inv.id }),
      ),
      "/investments",
    )

    expect(await prisma.investment.findUnique({ where: { id: inv.id } })).toBeNull()
  })

  it("returns INVESTMENT_NOT_OWNED for another user's investment", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const inv = await createInvestment(owner.id, {
      initialAmount: dollars(100),
      currentValue: dollars(100),
    })

    const result = await deleteInvestmentAction(
      { success: true, data: undefined },
      formData({ id: inv.id }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("INVESTMENT_NOT_OWNED")
  })
})
