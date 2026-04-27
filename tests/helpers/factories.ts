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
  parentTransactionId?: string | null
  totalInstallments?: number | null
  installmentNumber?: number | null
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
      totalInstallments: overrides.totalInstallments ?? null,
      installmentNumber: overrides.installmentNumber ?? null,
      ...(overrides.parentTransactionId
        ? { parentTransaction: { connect: { id: overrides.parentTransactionId } } }
        : {}),
      ...(overrides.creditCardId
        ? { creditCard: { connect: { id: overrides.creditCardId } } }
        : {}),
    },
  })
}

interface CategoryOverrides {
  name?: string
  alertThreshold?: number | null
  isAvoidable?: boolean
  isRecurring?: boolean
  scope?: "SYSTEM" | "USER" | "GROUP"
}

export async function createCategory(
  userId: string | null,
  overrides: CategoryOverrides = {},
) {
  const scope = overrides.scope ?? "USER"
  return prisma.category.create({
    data: {
      name: overrides.name ?? `cat-${randomUUID().slice(0, 8)}`,
      icon: "circle",
      color: "#888888",
      scope,
      alertThreshold: overrides.alertThreshold ?? null,
      isAvoidable: overrides.isAvoidable ?? false,
      isRecurring: overrides.isRecurring ?? false,
      ...(scope !== "SYSTEM" && userId
        ? { user: { connect: { id: userId } } }
        : {}),
    },
  })
}

export async function createTag(
  userId: string,
  overrides: { name?: string; color?: string } = {},
) {
  return prisma.tag.create({
    data: {
      name: overrides.name ?? `tag-${randomUUID().slice(0, 8)}`,
      color: overrides.color ?? "#6b7280",
      user: { connect: { id: userId } },
    },
  })
}

export async function createInvestmentSnapshot(
  investmentId: string,
  input: { date: Date; value: number },
) {
  return prisma.investmentSnapshot.create({
    data: {
      date: input.date,
      value: input.value,
      investment: { connect: { id: investmentId } },
    },
  })
}

interface BudgetOverrides {
  amount: number
  month: number
  year: number
  categoryId: string
}

export async function createBudget(userId: string, input: BudgetOverrides) {
  return prisma.budget.create({
    data: {
      amount: input.amount,
      month: input.month,
      year: input.year,
      user: { connect: { id: userId } },
      category: { connect: { id: input.categoryId } },
    },
  })
}

interface GoalOverrides {
  name?: string
  targetAmount: number
  targetDate?: Date | null
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED"
}

export async function createGoal(userId: string, input: GoalOverrides) {
  return prisma.goal.create({
    data: {
      name: input.name ?? `goal-${randomUUID().slice(0, 8)}`,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate ?? null,
      status: input.status ?? "ACTIVE",
      user: { connect: { id: userId } },
    },
  })
}

export async function createGoalContribution(
  userId: string,
  goalId: string,
  input: { amount: number; date?: Date },
) {
  return prisma.goalContribution.create({
    data: {
      amount: input.amount,
      date: input.date ?? today(),
      user: { connect: { id: userId } },
      goal: { connect: { id: goalId } },
    },
  })
}

interface InvestmentOverrides {
  name?: string
  type?:
    | "STOCKS"
    | "BONDS"
    | "CRYPTO"
    | "REAL_ESTATE"
    | "FUND"
    | "SAVINGS"
    | "OTHER"
  initialAmount: number
  currentValue: number
  startDate?: Date
}

export async function createInvestment(
  userId: string,
  input: InvestmentOverrides,
) {
  return prisma.investment.create({
    data: {
      name: input.name ?? `inv-${randomUUID().slice(0, 8)}`,
      type: input.type ?? "STOCKS",
      institution: "Test Broker",
      initialAmount: input.initialAmount,
      currentValue: input.currentValue,
      startDate: input.startDate ?? today(),
      user: { connect: { id: userId } },
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
