import { addDays, format, startOfDay } from "date-fns"
import { describe, expect, it } from "vitest"
import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils"
import { getDailyProjection } from "@/features/analytics/lib/projection.queries"
import {
  createCreditCard,
  createRecurringTemplate,
  createTransaction,
  createUser,
  daysFromNow,
  dollars,
} from "../../../../tests/helpers/factories"

const ymd = (d: Date) => format(d, "yyyy-MM-dd")

describe("getDailyProjection", () => {
  it("returns a flat zero projection for a user with no data", async () => {
    const user = await createUser()

    const result = await getDailyProjection(user.id, 90)

    expect(result.summary.startingBalance).toBe(0)
    expect(result.summary.balance30).toBe(0)
    expect(result.summary.balance60).toBe(0)
    expect(result.summary.balance90).toBe(0)
    expect(result.summary.willGoNegative).toBe(false)
    expect(result.summary.firstNegativeDate).toBeNull()
    expect(result.points).toHaveLength(91)
    expect(result.events).toHaveLength(0)
  })

  it("computes starting balance from past income minus past expenses", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(5000),
      impactDate: daysFromNow(-10),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(1500),
      impactDate: daysFromNow(-5),
    })

    const result = await getDailyProjection(user.id, 30)

    expect(result.summary.startingBalance).toBe(dollars(3500))
    expect(result.points[0].balance).toBe(dollars(3500))
    expect(result.summary.balance30).toBe(dollars(3500))
  })

  it("ignores template transactions when computing starting balance", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(2000),
      impactDate: daysFromNow(-1),
    })
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(99999),
      impactDate: daysFromNow(-1),
      isTemplate: true,
    })

    const result = await getDailyProjection(user.id, 30)

    expect(result.summary.startingBalance).toBe(dollars(2000))
  })

  it("places future one-off transactions on the correct day bucket", async () => {
    const user = await createUser()
    const futureDay = 5
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      impactDate: daysFromNow(futureDay),
    })

    const result = await getDailyProjection(user.id, 30)

    const point = result.points.find((p) => p.dayOffset === futureDay)
    expect(point?.dayInflow).toBe(dollars(1000))
    expect(point?.balance).toBe(dollars(1000))
    expect(result.points[futureDay - 1].balance).toBe(0)
    expect(result.summary.balance30).toBe(dollars(1000))
  })

  it("generates monthly AUTO recurring events within the horizon", async () => {
    const user = await createUser()
    const firstOccurrence = daysFromNow(10)
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(2000),
      frequency: "MONTHLY",
      interval: 1,
      generationMode: "AUTO",
      nextGenerationDate: firstOccurrence,
    })

    const result = await getDailyProjection(user.id, 90)

    const recurringEvents = result.events.filter((e) => e.source === "RECURRING")
    expect(recurringEvents.length).toBeGreaterThanOrEqual(3)
    expect(recurringEvents[0].date).toBe(ymd(firstOccurrence))
    expect(recurringEvents[0].amount).toBe(dollars(2000))
    expect(result.summary.balance90).toBe(recurringEvents.length * dollars(2000))
  })

  it("does not project SUGGEST or inactive recurring templates", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(9999),
      frequency: "MONTHLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(5),
    })
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(9999),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      isActive: false,
      nextGenerationDate: daysFromNow(5),
    })

    const result = await getDailyProjection(user.id, 90)

    expect(result.events.filter((e) => e.source === "RECURRING")).toHaveLength(0)
    expect(result.summary.balance90).toBe(0)
  })

  it("routes credit card recurring expenses through the statement payment date", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
    })
    const occurrence = daysFromNow(2)
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(300),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: occurrence,
      creditCardId: card.id,
    })

    const result = await getDailyProjection(user.id, 90)

    const recurringEvents = result.events.filter((e) => e.source === "RECURRING")
    expect(recurringEvents.length).toBeGreaterThanOrEqual(1)

    const firstEvent = recurringEvents[0]
    const expectedDue = computeStatementDates(20, 10, occurrence).paymentDueDate
    expect(firstEvent.date).toBe(format(expectedDue, "yyyy-MM-dd"))
    expect(firstEvent.date).not.toBe(format(occurrence, "yyyy-MM-dd"))
    expect(firstEvent.amount).toBe(-dollars(300))
  })

  it("consolidates two recurring expenses on the same card into one outflow bucket", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
    })
    const occurrence = daysFromNow(2)
    await createRecurringTemplate(user.id, {
      description: "Netflix",
      type: "EXPENSE",
      amount: dollars(15),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: occurrence,
      creditCardId: card.id,
    })
    await createRecurringTemplate(user.id, {
      description: "Spotify",
      type: "EXPENSE",
      amount: dollars(11),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: occurrence,
      creditCardId: card.id,
    })

    const result = await getDailyProjection(user.id, 90)

    const expectedDue = computeStatementDates(20, 10, occurrence).paymentDueDate
    const dueKey = format(expectedDue, "yyyy-MM-dd")
    const dueDayPoint = result.points.find((p) => p.date === dueKey)
    expect(dueDayPoint?.dayOutflow).toBe(dollars(26))
    expect(dueDayPoint?.dayInflow).toBe(0)
  })

  it("picks up persisted future installment children as one-off events", async () => {
    const user = await createUser()
    const purchaseDate = daysFromNow(1)
    const parent = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      description: "Laptop (1/3)",
      impactDate: daysFromNow(15),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      description: "Laptop (2/3)",
      impactDate: daysFromNow(45),
      date: purchaseDate,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      description: "Laptop (3/3)",
      impactDate: daysFromNow(75),
      date: purchaseDate,
    })
    expect(parent.id).toBeDefined()

    const result = await getDailyProjection(user.id, 90)

    const installmentEvents = result.events.filter((e) =>
      e.description.startsWith("Laptop"),
    )
    expect(installmentEvents).toHaveLength(3)
    expect(result.summary.balance90).toBe(-dollars(300))
  })

  it("flags willGoNegative and the firstNegativeDate when balance crosses zero", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(100),
      impactDate: daysFromNow(-1),
    })
    const negativeDay = 7
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      impactDate: daysFromNow(negativeDay),
    })

    const result = await getDailyProjection(user.id, 30)

    expect(result.summary.willGoNegative).toBe(true)
    expect(result.summary.firstNegativeDate).toBe(
      ymd(addDays(startOfDay(new Date()), negativeDay)),
    )
    expect(result.summary.lowestPoint?.balance).toBe(dollars(-400))
  })
})
