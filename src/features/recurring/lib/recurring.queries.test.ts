import { describe, expect, it } from "vitest"
import {
  getPendingGenerations,
  getPendingSuggestions,
  getRecurringTemplates,
} from "@/features/recurring/lib/recurring.queries"
import {
  createRecurringTemplate,
  createUser,
  daysFromNow,
  dollars,
} from "../../../../tests/helpers/factories"

describe("getRecurringTemplates", () => {
  it("returns all templates for the user (active and inactive, AUTO and SUGGEST)", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(5),
    })
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      frequency: "WEEKLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(5),
      isActive: false,
    })

    const templates = await getRecurringTemplates(user.id)
    expect(templates).toHaveLength(2)
  })

  it("does not leak templates from other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createRecurringTemplate(userA.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      nextGenerationDate: daysFromNow(5),
    })

    expect(await getRecurringTemplates(userB.id)).toEqual([])
  })
})

describe("getPendingGenerations", () => {
  it("returns only AUTO active templates with nextGenerationDate <= now", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-5), // overdue → match
    })
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(10), // future → skip
    })
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(-5), // SUGGEST → skip
    })
    await createRecurringTemplate(user.id, {
      type: "INCOME",
      amount: dollars(100),
      frequency: "MONTHLY",
      generationMode: "AUTO",
      isActive: false, // inactive → skip
      nextGenerationDate: daysFromNow(-5),
    })

    const pending = await getPendingGenerations(user.id)
    expect(pending).toHaveLength(1)
  })
})

describe("getPendingSuggestions", () => {
  it("returns only SUGGEST active templates due", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      frequency: "WEEKLY",
      generationMode: "SUGGEST",
      nextGenerationDate: daysFromNow(-3),
    })
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      frequency: "WEEKLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(-3),
    })

    const suggestions = await getPendingSuggestions(user.id)
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].recurrenceRule.generationMode).toBe("SUGGEST")
  })
})
