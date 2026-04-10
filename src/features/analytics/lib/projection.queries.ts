/**
 * Cashflow projection queries.
 *
 * Projects the user's daily balance into the future (30/60/90 days) using:
 * - Cumulative balance from existing transactions (impactDate <= today)
 * - Existing future transactions already in DB (future installments, scheduled txns)
 * - Projected AUTO recurring rules (iterated via computeNextDate)
 *
 * Credit card recurring templates have their impactDate computed through
 * computeStatementDates() to reflect real cash-out dates, not purchase dates.
 */

import { TransactionType } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";

import { computeNextDate } from "@/features/recurring/lib/recurring.utils";
import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils";

import type {
  LowestPoint,
  ProjectionEvent,
  ProjectionPoint,
  ProjectionResult,
  ProjectionSummary,
} from "@/features/analytics/types/analytics.types";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Compute a day-by-day cashflow projection for the next N days.
 *
 * Starting balance = sum of all INCOME minus abs(EXPENSE) with impactDate <= today.
 * Future events = existing future transactions + projected AUTO recurring occurrences.
 *
 * @param userId - The user whose projection to compute
 * @param days - Horizon in days (default 90). Result contains days + 1 points (today + N days).
 */
export async function getDailyProjection(
  userId: string,
  days = 90,
): Promise<ProjectionResult> {
  const today = startOfDay(new Date());
  const horizon = addDays(today, days);

  // ---------- 1. Starting balance (cumulative up to and including today) ----------
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        isTemplate: false,
        type: TransactionType.INCOME,
        impactDate: { lte: today },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        isTemplate: false,
        type: TransactionType.EXPENSE,
        impactDate: { lte: today },
      },
      _sum: { amount: true },
    }),
  ]);

  const startingBalance =
    (incomeAgg._sum.amount ?? 0) - Math.abs(expenseAgg._sum.amount ?? 0);

  // ---------- 2. Existing future transactions (today < impactDate <= horizon) ----------
  const existingFuture = await prisma.transaction.findMany({
    where: {
      userId,
      isTemplate: false,
      type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      impactDate: { gt: today, lte: horizon },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      type: true,
      impactDate: true,
    },
  });

  // ---------- 3. Active AUTO recurring templates ----------
  const recurringTemplates = await prisma.transaction.findMany({
    where: {
      userId,
      isTemplate: true,
      type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      recurrenceRule: {
        isActive: true,
        generationMode: "AUTO",
      },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      type: true,
      creditCardId: true,
      creditCard: {
        select: { closingDay: true, paymentDay: true },
      },
      recurrenceRule: {
        select: {
          frequency: true,
          interval: true,
          nextGenerationDate: true,
          endDate: true,
        },
      },
    },
  });

  // ---------- 4. Build event list ----------
  const events: ProjectionEvent[] = [];

  for (const tx of existingFuture) {
    const isIncome = tx.type === TransactionType.INCOME;
    events.push({
      date: toDateKey(tx.impactDate),
      amount: isIncome ? tx.amount : -Math.abs(tx.amount),
      description: tx.description,
      source: "EXISTING",
      transactionType: isIncome ? "INCOME" : "EXPENSE",
    });
  }

  // Safety cap: prevents infinite loops on malformed rules. 500 iterations
  // covers DAILY over 90 days (~90) with plenty of headroom for edge cases.
  const MAX_ITERATIONS = 500;

  for (const template of recurringTemplates) {
    const rule = template.recurrenceRule;
    if (!rule) continue;

    let occurrence = new Date(rule.nextGenerationDate);
    let guard = 0;

    while (guard++ < MAX_ITERATIONS) {
      if (rule.endDate && occurrence > rule.endDate) break;

      // Compute the real cash-out date: credit card purchases land on the
      // statement's payment due date, everything else lands on the occurrence.
      let impactDate: Date = occurrence;
      if (template.creditCardId && template.creditCard) {
        impactDate = computeStatementDates(
          template.creditCard.closingDay,
          template.creditCard.paymentDay,
          occurrence,
        ).paymentDueDate;
      }

      if (impactDate > horizon) break;

      if (impactDate > today) {
        const isIncome = template.type === TransactionType.INCOME;
        events.push({
          date: toDateKey(impactDate),
          amount: isIncome ? template.amount : -Math.abs(template.amount),
          description: template.description,
          source: "RECURRING",
          transactionType: isIncome ? "INCOME" : "EXPENSE",
        });
      }

      occurrence = computeNextDate(occurrence, rule.frequency, rule.interval);
    }
  }

  // ---------- 5. Bucket events by day ----------
  const buckets = new Map<string, { inflow: number; outflow: number }>();
  for (const ev of events) {
    const bucket = buckets.get(ev.date) ?? { inflow: 0, outflow: 0 };
    if (ev.amount >= 0) {
      bucket.inflow += ev.amount;
    } else {
      bucket.outflow += Math.abs(ev.amount);
    }
    buckets.set(ev.date, bucket);
  }

  // ---------- 6. Build day-by-day points ----------
  const points: ProjectionPoint[] = [];
  let runningBalance = startingBalance;

  points.push({
    date: toDateKey(today),
    dayOffset: 0,
    balance: runningBalance,
    dayInflow: 0,
    dayOutflow: 0,
    isNegative: runningBalance < 0,
  });

  for (let i = 1; i <= days; i++) {
    const day = addDays(today, i);
    const key = toDateKey(day);
    const bucket = buckets.get(key) ?? { inflow: 0, outflow: 0 };
    runningBalance += bucket.inflow - bucket.outflow;
    points.push({
      date: key,
      dayOffset: i,
      balance: runningBalance,
      dayInflow: bucket.inflow,
      dayOutflow: bucket.outflow,
      isNegative: runningBalance < 0,
    });
  }

  // ---------- 7. Summary ----------
  const pickBalance = (offset: number): number => {
    const idx = Math.min(offset, points.length - 1);
    return points[idx]?.balance ?? runningBalance;
  };

  let lowestPoint: LowestPoint | null = null;
  let firstNegativeDate: string | null = null;

  for (const p of points) {
    if (lowestPoint === null || p.balance < lowestPoint.balance) {
      lowestPoint = {
        date: p.date,
        balance: p.balance,
        dayOffset: p.dayOffset,
      };
    }
    if (p.isNegative && firstNegativeDate === null) {
      firstNegativeDate = p.date;
    }
  }

  const summary: ProjectionSummary = {
    startingBalance,
    balance30: pickBalance(30),
    balance60: pickBalance(60),
    balance90: pickBalance(90),
    lowestPoint,
    willGoNegative: firstNegativeDate !== null,
    firstNegativeDate,
    totalDays: days,
  };

  return { points, summary, events };
}
