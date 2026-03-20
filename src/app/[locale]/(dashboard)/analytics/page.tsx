import { getLocale, getTranslations } from "next-intl/server";

import type { CurrencyCode } from "@/shared/lib/constants";
import { requireSession } from "@/shared/lib/auth";

import {
  getIncomeVsExpensesTrend,
  getCashFlowForecast,
  getCategoryComparison,
  getDailySpending,
  getNetWorthTimeline,
  getBudgetVsActual,
  getFinancialHealthScore,
} from "@/features/analytics/lib/analytics.queries";
import { parseDateRange } from "@/features/analytics/lib/analytics.utils";

import { DateRangeSelector } from "@/features/analytics/components/date-range-selector";
import { IncomeVsExpensesChart } from "@/features/analytics/components/income-vs-expenses-chart";
import { CashFlowForecastChart } from "@/features/analytics/components/cash-flow-forecast-chart";
import { CategoryComparisonChart } from "@/features/analytics/components/category-comparison-chart";
import { SpendingHeatmap } from "@/features/analytics/components/spending-heatmap";
import { NetWorthChart } from "@/features/analytics/components/net-worth-chart";
import { BudgetVsActualChart } from "@/features/analytics/components/budget-vs-actual-chart";
import { FinancialHealthGauge } from "@/features/analytics/components/financial-health-gauge";

interface AnalyticsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const t = await getTranslations("analytics");
  const locale = await getLocale();
  const session = await requireSession();
  const rawParams = await searchParams;
  const currency = (session.user.currency ?? "USD") as CurrencyCode;
  const { from, to, preset } = parseDateRange(rawParams);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Category comparison: current month vs previous month
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const period1From = new Date(prevYear, prevMonth - 1, 1);
  const period1To = new Date(prevYear, prevMonth, 1);
  const period2From = new Date(currentYear, currentMonth - 1, 1);
  const period2To = new Date(currentYear, currentMonth, 1);

  const [
    trendData,
    forecastData,
    comparisonData,
    dailySpending,
    netWorthData,
    budgetData,
    healthScore,
  ] = await Promise.all([
    getIncomeVsExpensesTrend(session.user.id, 12),
    getCashFlowForecast(session.user.id, 3),
    getCategoryComparison(
      session.user.id,
      { from: period1From, to: period1To },
      { from: period2From, to: period2To },
    ),
    getDailySpending(session.user.id, from, to),
    getNetWorthTimeline(session.user.id),
    getBudgetVsActual(session.user.id, currentMonth, currentYear),
    getFinancialHealthScore(session.user.id),
  ]);

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  // Period labels for comparison chart (locale-aware)
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });
  const period1Label = monthFormatter.format(new Date(prevYear, prevMonth - 1));
  const period2Label = monthFormatter.format(new Date(currentYear, currentMonth - 1));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <DateRangeSelector currentPreset={preset} from={fromStr} to={toStr} />
      </div>

      <IncomeVsExpensesChart data={trendData} currency={currency} />

      <CashFlowForecastChart data={forecastData} currency={currency} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryComparisonChart
          data={comparisonData}
          currency={currency}
          period1Label={period1Label}
          period2Label={period2Label}
        />
        <BudgetVsActualChart data={budgetData} currency={currency} />
      </div>

      <SpendingHeatmap
        data={dailySpending}
        currency={currency}
        from={fromStr}
        to={toStr}
      />

      <NetWorthChart data={netWorthData} currency={currency} />

      <FinancialHealthGauge score={healthScore} />
    </div>
  );
}
