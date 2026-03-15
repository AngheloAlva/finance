import type {
  BudgetOptimizerResult,
  CategoryAnalysis,
  FinancialSnapshot,
} from "@/features/simulations/types/simulations.types";

export function computeBudgetOptimizer(
  snapshot: FinancialSnapshot,
): BudgetOptimizerResult {
  const { monthlyIncome, monthlyExpenses, expensesByCategory } = snapshot;

  const totalMonthlyExpenses = monthlyExpenses;

  let avoidableExpenses = 0;
  let nonAvoidableExpenses = 0;

  const categories: CategoryAnalysis[] = expensesByCategory.map((cat) => {
    if (cat.isAvoidable) {
      avoidableExpenses += cat.monthlyAverage;
    } else {
      nonAvoidableExpenses += cat.monthlyAverage;
    }

    const percentOfTotal =
      totalMonthlyExpenses > 0
        ? Math.round((cat.monthlyAverage / totalMonthlyExpenses) * 10000) / 100
        : 0;

    const exceedsThreshold =
      cat.alertThreshold !== null && cat.monthlyAverage > cat.alertThreshold;

    let suggestion: string | null = null;
    if (cat.isAvoidable && cat.monthlyAverage > 0) {
      const halfSavings = Math.round(cat.monthlyAverage / 2);
      suggestion = `Reduce by 50% to save ${halfSavings} cents/mo`;
    }

    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryColor: cat.categoryColor,
      categoryIcon: cat.categoryIcon,
      isAvoidable: cat.isAvoidable,
      monthlyAverage: cat.monthlyAverage,
      percentOfTotal,
      alertThreshold: cat.alertThreshold,
      exceedsThreshold,
      suggestion,
    };
  });

  // Sort: avoidable first, then by amount descending
  categories.sort((a, b) => {
    if (a.isAvoidable !== b.isAvoidable) return a.isAvoidable ? -1 : 1;
    return b.monthlyAverage - a.monthlyAverage;
  });

  const savingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100
      : 0;

  const expensesWithoutAvoidable = monthlyExpenses - avoidableExpenses;
  const potentialSavingsRate =
    monthlyIncome > 0
      ? Math.round(
          ((monthlyIncome - expensesWithoutAvoidable) / monthlyIncome) * 10000,
        ) / 100
      : 0;

  // Reduction scenarios: 25%, 50%, 75%, 100%
  const reductionScenarios = [25, 50, 75, 100].map((percent) => {
    const reduction = Math.round(avoidableExpenses * (percent / 100));
    const newExpenses = monthlyExpenses - reduction;
    const newSavingsRate =
      monthlyIncome > 0
        ? Math.round(((monthlyIncome - newExpenses) / monthlyIncome) * 10000) / 100
        : 0;

    return {
      label: `${percent}% reduction`,
      percent,
      monthlySavings: reduction,
      newSavingsRate,
    };
  });

  return {
    totalMonthlyExpenses,
    avoidableExpenses,
    nonAvoidableExpenses,
    monthlyIncome,
    savingsRate,
    potentialSavingsRate,
    categories,
    reductionScenarios,
  };
}
