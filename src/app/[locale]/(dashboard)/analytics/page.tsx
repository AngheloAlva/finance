import { getLocale, getTranslations } from "next-intl/server";

import { APP_CURRENCY } from "@/shared/lib/constants";
import { requireSession } from "@/shared/lib/auth";

import { getCreditCardOptions } from "@/features/credit-cards/lib/credit-cards.queries";
import { getUserCategories } from "@/features/categories/lib/categories.queries";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { getUserTagOptions } from "@/features/tags/lib/tags.queries";
import {
  getIncomeVsExpensesTrend,
  getCashFlowForecast,
  getCategoryComparison,
  getDailySpending,
  getNetWorthTimeline,
  getBudgetVsActual,
  getFinancialHealthScore,
} from "@/features/analytics/lib/analytics.queries";
import { getDailyProjection } from "@/features/analytics/lib/projection.queries";
import {
  expandCategoryIds,
  formatRangeLabel,
  getPreviousPeriod,
  hasActiveFilters,
  parseAnalyticsFilters,
  parseDateRange,
  toDateKey,
} from "@/features/analytics/lib/analytics-filters";

import { AnalyticsFiltersBar } from "@/features/analytics/components/analytics-filters-bar";
import { IncomeVsExpensesChart } from "@/features/analytics/components/income-vs-expenses-chart";
import { CashFlowForecastChart } from "@/features/analytics/components/cash-flow-forecast-chart";
import { CashflowProjection } from "@/features/analytics/components/cashflow-projection";
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
  const userId = session.user.id;
  const rawParams = await searchParams;
  const currency = APP_CURRENCY;

  const range = parseDateRange(rawParams);
  const filters = parseAnalyticsFilters(rawParams);
  const previousRange = getPreviousPeriod(range.from, range.to);

  const [categories, creditCards, tags] = await Promise.all([
    getUserCategories(userId, locale),
    getCreditCardOptions(userId),
    getUserTagOptions(userId),
  ]);
  const typedCategories = categories as CategoryWithChildren[];
  const queryFilters = {
    ...filters,
    categoryIds: expandCategoryIds(filters.categoryIds, typedCategories),
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    trend,
    comparisonData,
    dailySpending,
    netWorthData,
    forecastData,
    projectionData,
    budgetData,
    healthScore,
  ] = await Promise.all([
    getIncomeVsExpensesTrend(userId, range, queryFilters),
    getCategoryComparison(userId, previousRange, range, locale, queryFilters),
    getDailySpending(userId, range, queryFilters),
    getNetWorthTimeline(userId, range),
    getCashFlowForecast(userId, 3),
    getDailyProjection(userId, 90),
    getBudgetVsActual(userId, currentMonth, currentYear, locale),
    getFinancialHealthScore(userId),
  ]);

  const fromKey = toDateKey(range.from);
  const toKey = toDateKey(range.to);
  const rangeLabel = formatRangeLabel(fromKey, toKey, locale);
  const previousLabel = formatRangeLabel(
    toDateKey(previousRange.from),
    toDateKey(previousRange.to),
    locale,
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <AnalyticsFiltersBar
          preset={range.preset}
          from={fromKey}
          to={toKey}
          filters={filters}
          categories={typedCategories}
          creditCards={creditCards}
          tags={tags}
        />
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="analytics-period">
        <div>
          <h2 id="analytics-period" className="text-base font-semibold">
            {t("sections.period.title")}
          </h2>
          <p className="text-muted-foreground text-sm">{rangeLabel}</p>
        </div>

        <IncomeVsExpensesChart trend={trend} currency={currency} />

        <CategoryComparisonChart
          data={comparisonData}
          currency={currency}
          period1Label={previousLabel}
          period2Label={rangeLabel}
        />

        <SpendingHeatmap
          data={dailySpending}
          currency={currency}
          from={fromKey}
          to={toKey}
        />

        <NetWorthChart
          data={netWorthData}
          currency={currency}
          note={hasActiveFilters(filters) ? t("netWorth.filtersNote") : undefined}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="analytics-current">
        <div>
          <h2 id="analytics-current" className="text-base font-semibold">
            {t("sections.current.title")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("sections.current.description")}</p>
        </div>

        <BudgetVsActualChart data={budgetData} currency={currency} />

        <CashflowProjection data={projectionData} currency={currency} />

        <CashFlowForecastChart data={forecastData} currency={currency} />

        <FinancialHealthGauge score={healthScore} />
      </section>
    </div>
  );
}
