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

import { createRecurringAction } from "@/features/recurring/actions/create-recurring.action"
import { updateRecurringAction } from "@/features/recurring/actions/update-recurring.action"
import { deleteRecurringAction } from "@/features/recurring/actions/delete-recurring.action"
import { toggleRecurringAction } from "@/features/recurring/actions/toggle-recurring.action"
import { generateRecurringAction } from "@/features/recurring/actions/generate-recurring.action"
import { acceptSuggestionAction } from "@/features/recurring/actions/accept-suggestion.action"
import { skipSuggestionAction } from "@/features/recurring/actions/skip-suggestion.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createRecurringTemplate,
  createUser,
  daysFromNow,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createRecurringAction", () => {
  it("creates a template + recurrence rule atomically", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await createRecurringAction(
      { success: true, data: undefined },
      formData({
        amount: "10000",
        description: "Rent",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: cat.id,
        frequency: "MONTHLY",
        interval: "1",
        startDate: "2026-04-01",
      }),
    )

    expect(result.success).toBe(true)
    const tx = await prisma.transaction.findFirstOrThrow({
      where: { userId: user.id, isTemplate: true },
      include: { recurrenceRule: true },
    })
    expect(tx.recurrenceRule).not.toBeNull()
    expect(tx.recurrenceRule?.frequency).toBe("MONTHLY")
  })

  it("rolls back when category access fails", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)

    const result = await createRecurringAction(
      { success: true, data: undefined },
      formData({
        amount: "10000",
        description: "x",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: cat.id,
        frequency: "MONTHLY",
        interval: "1",
        startDate: "2026-04-01",
      }),
    )
    expect(result.success).toBe(false)
  })
})

describe("updateRecurringAction", () => {
  it("updates the template + rule for the owner", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(5),
    })

    const result = await updateRecurringAction(
      { success: true, data: undefined },
      formData({
        id: tmpl.id,
        amount: "20000",
        description: "Renamed",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: tmpl.categoryId,
        frequency: "WEEKLY",
        interval: "2",
        startDate: "2026-04-01",
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.transaction.findUniqueOrThrow({
      where: { id: tmpl.id },
      include: { recurrenceRule: true },
    })
    expect(updated.amount).toBe(20000)
    expect(updated.recurrenceRule?.frequency).toBe("WEEKLY")
  })
})

describe("deleteRecurringAction", () => {
  it("deletes the template (rule cascades)", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      nextGenerationDate: daysFromNow(5),
    })

    const result = await deleteRecurringAction(
      { success: true, data: undefined },
      formData({ id: tmpl.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.transaction.findUnique({ where: { id: tmpl.id } })).toBeNull()
    const rules = await prisma.recurrenceRule.findMany({ where: { transactionId: tmpl.id } })
    expect(rules).toHaveLength(0)
  })
})

describe("toggleRecurringAction", () => {
  it("flips the rule's isActive flag", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      nextGenerationDate: daysFromNow(5),
      isActive: true,
    })

    await toggleRecurringAction(
      { success: true, data: undefined },
      formData({ id: tmpl.id }),
    )

    const rule = await prisma.recurrenceRule.findFirstOrThrow({
      where: { transactionId: tmpl.id },
    })
    expect(rule.isActive).toBe(false)
  })
})

describe("generateRecurringAction", () => {
  it("generates pending instances and returns the count", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-30),
    })

    const result = await generateRecurringAction()

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.count).toBeGreaterThanOrEqual(1)
  })
})

describe("acceptSuggestionAction", () => {
  it("creates a transaction from a SUGGEST template and advances the rule", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(-1),
    })

    const result = await acceptSuggestionAction(
      { success: true, data: undefined },
      formData({ templateId: tmpl.id }),
    )

    expect(result.success).toBe(true)
    const generated = await prisma.transaction.findFirstOrThrow({
      where: { generatedFromId: tmpl.id, isTemplate: false },
    })
    expect(generated.amount).toBe(dollars(50))
  })

  it("rejects when template is in AUTO mode", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-1),
    })

    const result = await acceptSuggestionAction(
      { success: true, data: undefined },
      formData({ templateId: tmpl.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("SUGGESTION_NOT_SUGGEST_MODE")
  })
})

describe("skipSuggestionAction", () => {
  it("advances the rule's nextGenerationDate without creating a transaction", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tmpl = await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(-1),
    })

    const beforeRule = await prisma.recurrenceRule.findFirstOrThrow({
      where: { transactionId: tmpl.id },
    })

    const result = await skipSuggestionAction(
      { success: true, data: undefined },
      formData({ templateId: tmpl.id }),
    )

    expect(result.success).toBe(true)
    const generated = await prisma.transaction.count({
      where: { generatedFromId: tmpl.id, isTemplate: false },
    })
    expect(generated).toBe(0)

    const afterRule = await prisma.recurrenceRule.findFirstOrThrow({
      where: { transactionId: tmpl.id },
    })
    expect(afterRule.nextGenerationDate.getTime()).toBeGreaterThan(
      beforeRule.nextGenerationDate.getTime(),
    )
  })
})
