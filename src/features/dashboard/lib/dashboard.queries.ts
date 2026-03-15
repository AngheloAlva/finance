import { TransactionType } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types";

import type {
  MonthlyOverview,
  CategoryBreakdownItem,
  MonthlyFlowItem,
  PortfolioSummary,
} from "@/features/dashboard/types/dashboard.types";

export { getTopActiveGoals } from "@/features/goals/lib/goals.queries";

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export async function getMonthlyOverview(
  userId: string,
  month: number,
  year: number,
): Promise<MonthlyOverview> {
  const { start, end } = getMonthRange(month, year);

  const dateFilter = {
    impactDate: { gte: start, lt: end },
    userId,
    isTemplate: false as const,
  };

  const [incomeResult, expenseResult, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...dateFilter, type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...dateFilter, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: dateFilter }),
  ]);

  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpenses = Math.abs(expenseResult._sum.amount ?? 0);
  const balance = totalIncome - totalExpenses;

  return { totalIncome, totalExpenses, balance, transactionCount };
}

export async function getCategoryBreakdown(
  userId: string,
  month: number,
  year: number,
): Promise<CategoryBreakdownItem[]> {
  const { start, end } = getMonthRange(month, year);

  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      isTemplate: false,
      impactDate: { gte: start, lt: end },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "asc" } },
  });

  if (groups.length === 0) return [];

  const categoryIds = groups.map((g) => g.categoryId);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true, icon: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totalExpenses = groups.reduce(
    (sum, g) => sum + Math.abs(g._sum.amount ?? 0),
    0,
  );

  return groups
    .map((g) => {
      const category = categoryMap.get(g.categoryId);
      const total = Math.abs(g._sum.amount ?? 0);

      return {
        categoryId: g.categoryId,
        categoryName: category?.name ?? "Unknown",
        categoryColor: category?.color ?? "#6b7280",
        categoryIcon: category?.icon ?? "circle",
        total,
        percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export async function getMonthlyFlow(
  userId: string,
  endMonth: number,
  endYear: number,
  months = 6,
): Promise<MonthlyFlowItem[]> {
  let currentMonth = endMonth;
  let currentYear = endYear;

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
    };
  });
}

export async function getPortfolioSummary(
  userId: string,
): Promise<PortfolioSummary> {
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true },
    select: { initialAmount: true, currentValue: true },
  });

  const totalInvested = investments.reduce(
    (sum, i) => sum + i.initialAmount,
    0,
  );
  const totalCurrentValue = investments.reduce(
    (sum, i) => sum + i.currentValue,
    0,
  );
  const absoluteReturn = totalCurrentValue - totalInvested;
  const returnPercentage =
    totalInvested > 0
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
      : 0;

  return {
    totalInvested,
    totalCurrentValue,
    absoluteReturn,
    returnPercentage: Math.round(returnPercentage * 100) / 100,
    count: investments.length,
  };
}

export async function getRecentTransactions(
  userId: string,
  limit = 5,
): Promise<TransactionWithCategory[]> {
  return prisma.transaction.findMany({
    where: { userId, isTemplate: false },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
      creditCard: {
        select: { name: true, lastFourDigits: true, color: true },
      },
    },
  });
}
