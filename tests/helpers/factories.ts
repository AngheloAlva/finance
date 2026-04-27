import { randomUUID } from "node:crypto"
import { addDays, startOfDay } from "date-fns"
import { prisma } from "@/shared/lib/prisma"

export const dollars = (n: number) => Math.round(n * 100)

export const today = () => startOfDay(new Date())

export const daysFromNow = (n: number) => addDays(today(), n)

interface UserOverrides {
  email?: string
  name?: string
  currency?: string
  timezone?: string
}

export async function createUser(overrides: UserOverrides = {}) {
  const id = randomUUID()
  return prisma.user.create({
    data: {
      id,
      email: overrides.email ?? `user-${id}@test.local`,
      name: overrides.name ?? "Test User",
      emailVerified: true,
      currency: overrides.currency ?? "USD",
      timezone: overrides.timezone ?? "UTC",
    },
  })
}

interface CreditCardOverrides {
  name?: string
  closingDay?: number
  paymentDay?: number
  totalLimit?: number
  brand?: string
  lastFourDigits?: string
}

export async function createCreditCard(
  userId: string,
  overrides: CreditCardOverrides = {},
) {
  return prisma.creditCard.create({
    data: {
      user: { connect: { id: userId } },
      name: overrides.name ?? "Test Card",
      closingDay: overrides.closingDay ?? 15,
      paymentDay: overrides.paymentDay ?? 5,
      totalLimit: overrides.totalLimit ?? dollars(10000),
      brand: overrides.brand ?? "VISA",
      lastFourDigits: overrides.lastFourDigits ?? "4242",
      color: "#000000",
    },
  })
}

export async function getOrCreateDefaultCategory(userId: string) {
  const existing = await prisma.category.findFirst({
    where: { userId, name: "Test Default" },
  })
  if (existing) return existing
  return prisma.category.create({
    data: {
      name: "Test Default",
      icon: "circle",
      color: "#888888",
      user: { connect: { id: userId } },
    },
  })
}

interface TransactionOverrides {
  description?: string
  amount: number
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  date?: Date
  impactDate?: Date
  isTemplate?: boolean
  creditCardId?: string | null
  categoryId?: string | null
}

export async function createTransaction(
  userId: string,
  overrides: TransactionOverrides,
) {
  const date = overrides.date ?? overrides.impactDate ?? today()
  const categoryId =
    overrides.categoryId ?? (await getOrCreateDefaultCategory(userId)).id
  return prisma.transaction.create({
    data: {
      user: { connect: { id: userId } },
      category: { connect: { id: categoryId } },
      description: overrides.description ?? `tx-${randomUUID().slice(0, 8)}`,
      amount: overrides.amount,
      type: overrides.type,
      date,
      impactDate: overrides.impactDate ?? date,
      isTemplate: overrides.isTemplate ?? false,
      ...(overrides.creditCardId
        ? { creditCard: { connect: { id: overrides.creditCardId } } }
        : {}),
    },
  })
}

interface RecurringTemplateInput {
  description?: string
  amount: number
  type: "INCOME" | "EXPENSE"
  frequency:
    | "DAILY"
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "BIMONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "ANNUAL"
  interval?: number
  generationMode?: "AUTO" | "SUGGEST"
  isActive?: boolean
  nextGenerationDate: Date
  endDate?: Date | null
  creditCardId?: string | null
}

export async function createRecurringTemplate(
  userId: string,
  input: RecurringTemplateInput,
) {
  const categoryId = (await getOrCreateDefaultCategory(userId)).id
  const template = await prisma.transaction.create({
    data: {
      user: { connect: { id: userId } },
      category: { connect: { id: categoryId } },
      description: input.description ?? `tmpl-${randomUUID().slice(0, 8)}`,
      amount: input.amount,
      type: input.type,
      date: input.nextGenerationDate,
      impactDate: input.nextGenerationDate,
      isTemplate: true,
      ...(input.creditCardId
        ? { creditCard: { connect: { id: input.creditCardId } } }
        : {}),
      recurrenceRule: {
        create: {
          frequency: input.frequency,
          interval: input.interval ?? 1,
          generationMode: input.generationMode ?? "AUTO",
          isActive: input.isActive ?? true,
          nextGenerationDate: input.nextGenerationDate,
          endDate: input.endDate ?? null,
        },
      },
    },
    include: { recurrenceRule: true },
  })
  return template
}
