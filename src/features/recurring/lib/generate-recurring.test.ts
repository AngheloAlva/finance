import { describe, expect, it } from "vitest"
import { generatePendingRecurring } from "@/features/recurring/lib/generate-recurring"
import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils"
import { prisma } from "@/shared/lib/prisma"
import {
  createCreditCard,
  createRecurringTemplate,
  createUser,
  daysFromNow,
  dollars,
} from "../../../../tests/helpers/factories"

describe("generatePendingRecurring", () => {
  it("returns 0 when there are no active AUTO templates", async () => {
    const user = await createUser()

    const count = await generatePendingRecurring(user.id)

    expect(count).toBe(0)
  })

  it("generates one instance per overdue MONTHLY occurrence and advances the rule", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-65), // ~2 overdue + today
    })

    const count = await generatePendingRecurring(user.id)

    expect(count).toBeGreaterThanOrEqual(2)

    const generated = await prisma.transaction.findMany({
      where: { userId: user.id, isTemplate: false },
    })
    expect(generated.length).toBe(count)
    expect(generated.every((t) => t.amount === dollars(1000))).toBe(true)

    const rule = await prisma.recurrenceRule.findFirstOrThrow({
      where: { transaction: { userId: user.id } },
    })
    expect(rule.nextGenerationDate.getTime()).toBeGreaterThan(
      daysFromNow(0).getTime(),
    )
  })

  it("routes credit card recurring expenses through the statement payment date", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
    })
    const occurrence = daysFromNow(-2)
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: occurrence,
      creditCardId: card.id,
    })

    await generatePendingRecurring(user.id)

    const generated = await prisma.transaction.findFirstOrThrow({
      where: { userId: user.id, isTemplate: false },
    })
    const expectedDue = computeStatementDates(20, 10, occurrence).paymentDueDate
    expect(generated.impactDate.toISOString()).toBe(expectedDue.toISOString())
    expect(generated.date.toISOString()).toBe(occurrence.toISOString())
  })

  it("does not double-create when called twice (duplicate guard)", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(500),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-30),
    })

    const first = await generatePendingRecurring(user.id)
    const second = await generatePendingRecurring(user.id)

    expect(second).toBe(0)
    const total = await prisma.transaction.count({
      where: { userId: user.id, isTemplate: false },
    })
    expect(total).toBe(first)
  })

  it("ignores SUGGEST mode templates", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(99),
      frequency: "MONTHLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(-30),
    })

    const count = await generatePendingRecurring(user.id)

    expect(count).toBe(0)
  })

  it("ignores inactive rules", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(99),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      isActive: false,
      nextGenerationDate: daysFromNow(-30),
    })

    const count = await generatePendingRecurring(user.id)

    expect(count).toBe(0)
  })

  it("deactivates the rule when nextGenerationDate moves past endDate", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-30),
      endDate: daysFromNow(-15),
    })

    await generatePendingRecurring(user.id)

    const rule = await prisma.recurrenceRule.findFirstOrThrow({
      where: { transaction: { userId: user.id } },
    })
    expect(rule.isActive).toBe(false)
  })

  it("does not generate transactions for other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createRecurringTemplate(userA.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-30),
    })

    const generatedForB = await generatePendingRecurring(userB.id)

    expect(generatedForB).toBe(0)
    const txOfB = await prisma.transaction.count({
      where: { userId: userB.id, isTemplate: false },
    })
    expect(txOfB).toBe(0)
  })
})
