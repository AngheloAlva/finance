import { GoalStatus, TransactionType } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";

import type {
  TrendPoint,
  ForecastPoint,
  CategoryComparisonItem,
  DailySpendingItem,
  NetWorthPoint,
  BudgetVsActualItem,
  HealthScoreResult,
  DateRange,
} from "@/features/analytics/types/analytics.types";
import { computeHealthSubScore } from "@/features/analytics/lib/analytics.utils";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

// ---------- 1. Income vs Expenses Trend ----------

export async function getIncomeVsExpensesTrend(
  userId: string,
  months = 12,
): Promise<TrendPoint[]> {
  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();

  const monthsToFetch: Array<{ month: number; year: number }> = [];

  for (let i = 0; i < months; i++) {
    monthsToFetch.unshift({ month: currentMonth, year: currentYear });
    currentMonth--;
    if (currentMonth === 0) {
      currentMonth = 12;
      currentYear--;
    }
  }

  const firstMonth = monthsToFetch[0];
  const lastMonth = monthsToFetch[monthsToFetch.length - 1];
  const rangeStart = getMonthRange(firstMonth.month, firstMonth.year).start;
  const rangeEnd = getMonthRange(lastMonth.month, lastMonth.year).end;

  const groups = await prisma.transaction.groupBy({
    by: ["type", "impactDate"],
    where: {
      userId,
      isTemplate: false,
      type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      impactDate: { gte: rangeStart, lt: rangeEnd },
    },
    _sum: { amount: true },
  });

  // Bucket results by month key and type
  const buckets = new Map<string, { income: number; expenses: number }>();

  for (const group of groups) {
    const d = group.impactDate;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(monthKey) ?? { income: 0, expenses: 0 };

    if (group.type === TransactionType.INCOME) {
      bucket.income += group._sum.amount ?? 0;
    } else {
      bucket.expenses += Math.abs(group._sum.amount ?? 0);
    }

    buckets.set(monthKey, bucket);
  }

  return monthsToFetch.map(({ month, year }) => {
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const bucket = buckets.get(monthKey) ?? { income: 0, expenses: 0 };

    return {
      month: monthKey,
      label: MONTH_LABELS[month - 1],
      income: bucket.income,
      expenses: bucket.expenses,
      netSavings: bucket.income - bucket.expenses,
    };
  });
}

// ---------- 2. Cash Flow Forecast ----------

export async function getCashFlowForecast(
  userId: string,
  forecastMonths = 3,
): Promise<ForecastPoint[]> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch 3 actual months
  const actualMonths = 3;
  let m = currentMonth;
  let y = currentYear;

  const pastMonths: Array<{ month: number; year: number }> = [];
  for (let i = 0; i < actualMonths; i++) {
    pastMonths.unshift({ month: m, year: y });
    m--;
    if (m === 0) {
      m = 12;
      y--;
    }
  }

  // Fetch actual data
  const actuals: ForecastPoint[] = await Promise.all(
    pastMonths.map(async ({ month, year }) => {
      const { start, end } = getMonthRange(month, year);
      const dateFilter = {
        impactDate: { gte: start, lt: end },
        userId,
        isTemplate: false as const,
      };

      const [incomeResult, expenseResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...dateFilter, type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { ...dateFilter, type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
      ]);

      const income = incomeResult._sum.amount ?? 0;
      const expenses = Math.abs(expenseResult._sum.amount ?? 0);

      return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        label: MONTH_LABELS[month - 1],
        income,
        expenses,
        netFlow: income - expenses,
        isProjected: false,
      };
    }),
  );

  // Check if we have enough history
  const hasData = actuals.some((a) => a.income > 0 || a.expenses > 0);
  if (!hasData) return actuals;

  // Calculate rolling averages from actual months
  const avgIncome = Math.round(
    actuals.reduce((sum, a) => sum + a.income, 0) / actualMonths,
  );
  const avgExpenses = Math.round(
    actuals.reduce((sum, a) => sum + a.expenses, 0) / actualMonths,
  );

  // Query recurring templates for projection
  const recurringTemplates = await prisma.transaction.findMany({
    where: {
      userId,
      isTemplate: true,
      recurrenceRule: { isActive: true },
    },
    select: {
      amount: true,
      type: true,
    },
  });

  const recurringIncome = recurringTemplates
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const recurringExpenses = recurringTemplates
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Generate projected months
  let pm = currentMonth;
  let py = currentYear;

  const projected: ForecastPoint[] = [];
  for (let i = 0; i < forecastMonths; i++) {
    pm++;
    if (pm > 12) {
      pm = 1;
      py++;
    }

    const { start, end } = getMonthRange(pm, py);

    // Query future installments for this projected month
    const installmentResult = await prisma.transaction.aggregate({
      where: {
        userId,
        isTemplate: false,
        type: TransactionType.EXPENSE,
        totalInstallments: { not: null },
        impactDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const installmentExpenses = Math.abs(installmentResult._sum.amount ?? 0);

    // Use recurring if available, otherwise fall back to average
    const projectedIncome =
      recurringIncome > 0 ? recurringIncome : avgIncome;
    const nonRecurringExpenseAvg =
      recurringExpenses > 0
        ? Math.max(0, avgExpenses - recurringExpenses)
        : avgExpenses;
    const projectedExpenses =
      recurringExpenses + installmentExpenses + nonRecurringExpenseAvg;

    projected.push({
      month: `${py}-${String(pm).padStart(2, "0")}`,
      label: MONTH_LABELS[pm - 1],
      income: projectedIncome,
      expenses: projectedExpenses,
      netFlow: projectedIncome - projectedExpenses,
      isProjected: true,
    });
  }

  return [...actuals, ...projected];
}

// ---------- 3. Category Comparison ----------

export async function getCategoryComparison(
  userId: string,
  period1: DateRange,
  period2: DateRange,
): Promise<CategoryComparisonItem[]> {
  const baseWhere = {
    userId,
    type: TransactionType.EXPENSE,
    isTemplate: false,
  } as const;

  const [groups1, groups2] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        impactDate: { gte: period1.from, lt: period1.to },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        impactDate: { gte: period2.from, lt: period2.to },
      },
      _sum: { amount: true },
    }),
  ]);

  // Merge all category IDs
  const allCategoryIds = new Set([
    ...groups1.map((g) => g.categoryId),
    ...groups2.map((g) => g.categoryId),
  ]);

  if (allCategoryIds.size === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: [...allCategoryIds] } },
    select: { id: true, name: true, color: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const map1 = new Map(
    groups1.map((g) => [g.categoryId, Math.abs(g._sum.amount ?? 0)]),
  );
  const map2 = new Map(
    groups2.map((g) => [g.categoryId, Math.abs(g._sum.amount ?? 0)]),
  );

  return [...allCategoryIds]
    .map((categoryId) => {
      const category = categoryMap.get(categoryId);
      const p1 = map1.get(categoryId) ?? 0;
      const p2 = map2.get(categoryId) ?? 0;
      const change = p1 > 0 ? Math.round(((p2 - p1) / p1) * 100) : p2 > 0 ? 100 : 0;

      return {
        categoryId,
        categoryName: category?.name ?? "Unknown",
        categoryColor: category?.color ?? "#6b7280",
        period1Total: p1,
        period2Total: p2,
        change,
      };
    })
    .sort((a, b) => Math.max(b.period1Total, b.period2Total) - Math.max(a.period1Total, a.period2Total));
}

// ---------- 4. Daily Spending ----------

export async function getDailySpending(
  userId: string,
  from: Date,
  to: Date,
): Promise<DailySpendingItem[]> {
  // Clamp to max 365 days
  const maxMs = 365 * 24 * 60 * 60 * 1000;
  const diff = to.getTime() - from.getTime();
  const clampedFrom = diff > maxMs ? new Date(to.getTime() - maxMs) : from;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      isTemplate: false,
      impactDate: { gte: clampedFrom, lt: to },
    },
    select: { impactDate: true, amount: true },
  });

  // Aggregate in JS (max 365 days of data)
  const dailyMap = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const dateKey = tx.impactDate.toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) ?? { total: 0, count: 0 };
    existing.total += Math.abs(tx.amount);
    existing.count++;
    dailyMap.set(dateKey, existing);
  }

  return [...dailyMap.entries()]
    .map(([date, { total, count }]) => ({ date, total, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- 5. Net Worth Timeline ----------

export async function getNetWorthTimeline(
  userId: string,
): Promise<NetWorthPoint[]> {
  const snapshots = await prisma.investmentSnapshot.findMany({
    where: { investment: { userId } },
    select: { date: true, value: true },
    orderBy: { date: "asc" },
  });

  if (snapshots.length === 0) return [];

  // Group snapshots by month and sum values
  const monthlyAssets = new Map<string, number>();
  for (const snap of snapshots) {
    const monthKey = `${snap.date.getFullYear()}-${String(snap.date.getMonth() + 1).padStart(2, "0")}`;
    const current = monthlyAssets.get(monthKey) ?? 0;
    monthlyAssets.set(monthKey, current + snap.value);
  }

  // Get outstanding installments grouped by month
  const now = new Date();
  const futureInstallments = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      isTemplate: false,
      totalInstallments: { not: null },
      impactDate: { gt: now },
    },
    select: { impactDate: true, amount: true },
  });

  const monthlyLiabilities = new Map<string, number>();
  for (const tx of futureInstallments) {
    const monthKey = `${tx.impactDate.getFullYear()}-${String(tx.impactDate.getMonth() + 1).padStart(2, "0")}`;
    const current = monthlyLiabilities.get(monthKey) ?? 0;
    monthlyLiabilities.set(monthKey, current + Math.abs(tx.amount));
  }

  // Total outstanding liabilities (sum of all future installments)
  const totalLiabilities = futureInstallments.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );

  return [...monthlyAssets.entries()].map(([date, assets]) => {
    // For each month, liabilities = total outstanding at that point
    const liabilities = totalLiabilities;
    return {
      date,
      assets,
      liabilities,
      netWorth: assets - liabilities,
    };
  });
}

// ---------- 6. Budget vs Actual ----------

export async function getBudgetVsActual(
  userId: string,
  month: number,
  year: number,
): Promise<BudgetVsActualItem[]> {
  const { start, end } = getMonthRange(month, year);

  // Get categories with alertThreshold set
  const categories = await prisma.category.findMany({
    where: {
      userId,
      alertThreshold: { not: null },
    },
    select: { id: true, name: true, color: true, icon: true, alertThreshold: true },
  });

  if (categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);

  // Aggregate actual spending per category
  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      isTemplate: false,
      categoryId: { in: categoryIds },
      impactDate: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  const actualMap = new Map(
    groups.map((g) => [g.categoryId, Math.abs(g._sum.amount ?? 0)]),
  );

  return categories.map((category) => {
    const budget = category.alertThreshold!;
    const actual = actualMap.get(category.id) ?? 0;
    const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0;

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      budget,
      actual,
      percentage,
    };
  });
}

// ---------- 7. Financial Health Score ----------

export async function getFinancialHealthScore(
  userId: string,
): Promise<HealthScoreResult> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Check if user has enough data (at least 2 months of transactions)
  // Use groupBy to count distinct year-month combos instead of fetching all distinct dates
  const monthGroups = await prisma.transaction.groupBy({
    by: ["impactDate"],
    where: { userId, isTemplate: false },
    _count: true,
  });

  const uniqueMonths = new Set(
    monthGroups.map(
      (g) =>
        `${g.impactDate.getFullYear()}-${g.impactDate.getMonth() + 1}`,
    ),
  );

  if (uniqueMonths.size < 2) {
    return {
      overall: 0,
      factors: [],
      label: "Insufficient Data",
      hasEnoughData: false,
    };
  }

  // Build month ranges for savings (3 months) and expense consistency (6 months)
  const monthRanges6: Array<{ month: number; year: number }> = [];
  let m = currentMonth;
  let y = currentYear;
  for (let i = 0; i < 6; i++) {
    monthRanges6.push({ month: m, year: y });
    m--;
    if (m === 0) { m = 12; y--; }
  }

  // Parallelize ALL independent queries:
  // - 3 months of income aggregates (for savings rate)
  // - 6 months of expense aggregates (first 3 for savings, all 6 for consistency)
  // - Credit cards lookup
  // - Future installments aggregate
  // - Goal contributions aggregate
  const [incomeResults, expenseResults, creditCards, futureInstallments, goalContributions] =
    await Promise.all([
      // Income for first 3 months (savings rate)
      Promise.all(
        monthRanges6.slice(0, 3).map(({ month, year }) => {
          const { start, end } = getMonthRange(month, year);
          return prisma.transaction.aggregate({
            where: {
              impactDate: { gte: start, lt: end },
              userId,
              isTemplate: false,
              type: TransactionType.INCOME,
            },
            _sum: { amount: true },
          });
        }),
      ),
      // Expenses for all 6 months (savings + consistency)
      Promise.all(
        monthRanges6.map(({ month, year }) => {
          const { start, end } = getMonthRange(month, year);
          return prisma.transaction.aggregate({
            where: {
              impactDate: { gte: start, lt: end },
              userId,
              isTemplate: false,
              type: TransactionType.EXPENSE,
            },
            _sum: { amount: true },
          });
        }),
      ),
      // Credit cards
      prisma.creditCard.findMany({
        where: { userId, isActive: true },
        select: { id: true, totalLimit: true },
      }),
      // Installment burden
      prisma.transaction.aggregate({
        where: {
          userId,
          isTemplate: false,
          totalInstallments: { not: null },
          impactDate: { gt: now },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Emergency fund
      prisma.goalContribution.aggregate({
        where: {
          userId,
          goal: { status: GoalStatus.ACTIVE },
        },
        _sum: { amount: true },
      }),
    ]);

  // 1. Savings Rate (last 3 months)
  const savingsMonths = incomeResults.map((inc, i) => ({
    income: inc._sum.amount ?? 0,
    expenses: Math.abs(expenseResults[i]._sum.amount ?? 0),
  }));

  const totalIncome3m = savingsMonths.reduce((s, m) => s + m.income, 0);
  const totalExpenses3m = savingsMonths.reduce((s, m) => s + m.expenses, 0);
  const savingsRate = totalIncome3m > 0 ? (totalIncome3m - totalExpenses3m) / totalIncome3m : 0;
  const savingsScore = computeHealthSubScore(savingsRate, [
    { threshold: 0.20, score: 100 },
    { threshold: 0.15, score: 80 },
    { threshold: 0.10, score: 60 },
    { threshold: 0.05, score: 40 },
    { threshold: 0, score: 20 },
    { threshold: -Infinity, score: 0 },
  ]);

  // 2. Credit Utilization
  let creditScore: number;
  if (creditCards.length === 0) {
    creditScore = 80;
  } else {
    const totalLimit = creditCards.reduce((s, c) => s + c.totalLimit, 0);

    // Get current cycle spending across all credit cards
    const creditSpending = await prisma.transaction.aggregate({
      where: {
        userId,
        isTemplate: false,
        creditCardId: { in: creditCards.map((c) => c.id) },
        type: TransactionType.EXPENSE,
        impactDate: {
          gte: getMonthRange(currentMonth, currentYear).start,
          lt: getMonthRange(currentMonth, currentYear).end,
        },
      },
      _sum: { amount: true },
    });

    const used = Math.abs(creditSpending._sum.amount ?? 0);
    const utilization = totalLimit > 0 ? used / totalLimit : 0;

    creditScore = computeHealthSubScore(1 - utilization, [
      { threshold: 0.90, score: 100 },
      { threshold: 0.80, score: 90 },
      { threshold: 0.70, score: 70 },
      { threshold: 0.50, score: 40 },
      { threshold: 0.30, score: 20 },
      { threshold: 0, score: 0 },
    ]);
  }

  // 3. Expense Consistency (last 6 months) - data already fetched in parallel
  const expenseMonths = expenseResults.map((r) => Math.abs(r._sum.amount ?? 0));

  const mean = expenseMonths.reduce((s, v) => s + v, 0) / expenseMonths.length;
  const stdDev = Math.sqrt(
    expenseMonths.reduce((s, v) => s + (v - mean) ** 2, 0) / expenseMonths.length,
  );
  const cv = mean > 0 ? stdDev / mean : 0;

  const consistencyScore = computeHealthSubScore(1 - cv, [
    { threshold: 0.90, score: 100 },
    { threshold: 0.80, score: 80 },
    { threshold: 0.70, score: 60 },
    { threshold: 0.50, score: 30 },
    { threshold: 0, score: 0 },
  ]);

  // 4. Installment Burden - data already fetched in parallel
  const avgMonthlyIncome = totalIncome3m / 3;
  const monthlyInstallmentLoad =
    futureInstallments._count > 0 && avgMonthlyIncome > 0
      ? Math.abs(futureInstallments._sum.amount ?? 0) /
        Math.max(1, futureInstallments._count) /
        avgMonthlyIncome
      : 0;

  const installmentScore =
    futureInstallments._count === 0
      ? 100
      : computeHealthSubScore(1 - monthlyInstallmentLoad, [
          { threshold: 0.90, score: 100 },
          { threshold: 0.80, score: 75 },
          { threshold: 0.70, score: 50 },
          { threshold: 0.50, score: 20 },
          { threshold: 0, score: 0 },
        ]);

  // 5. Emergency Fund Coverage - data already fetched in parallel
  const avgMonthlyExpenses = totalExpenses3m / 3;
  const monthsCovered =
    avgMonthlyExpenses > 0
      ? (goalContributions._sum.amount ?? 0) / avgMonthlyExpenses
      : 0;

  let emergencyScore: number;
  if (goalContributions._sum.amount === null || goalContributions._sum.amount === 0) {
    emergencyScore = 50;
  } else {
    emergencyScore = computeHealthSubScore(monthsCovered, [
      { threshold: 6, score: 100 },
      { threshold: 3, score: 70 },
      { threshold: 1, score: 40 },
      { threshold: 0, score: 10 },
    ]);
  }

  // Compute weighted overall
  const factors = [
    { name: "Savings Rate", score: Math.round(savingsScore), weight: 0.30, description: "Income saved over last 3 months" },
    { name: "Credit Utilization", score: Math.round(creditScore), weight: 0.25, description: "Credit card usage vs limits" },
    { name: "Expense Consistency", score: Math.round(consistencyScore), weight: 0.20, description: "Monthly spending stability" },
    { name: "Installment Burden", score: Math.round(installmentScore), weight: 0.15, description: "Installment payments vs income" },
    { name: "Emergency Fund", score: Math.round(emergencyScore), weight: 0.10, description: "Savings coverage for expenses" },
  ];

  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  );

  let label: string;
  if (overall >= 80) label = "Excellent";
  else if (overall >= 65) label = "Good";
  else if (overall >= 50) label = "Fair";
  else if (overall >= 35) label = "Needs Work";
  else label = "Critical";

  return { overall, factors, label, hasEnoughData: true };
}
