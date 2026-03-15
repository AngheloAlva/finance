import type {
  FinancialSnapshot,
  GoalImpact,
  IncomeImpactInput,
  IncomeImpactResult,
} from "@/features/simulations/types/simulations.types";

export function computeIncomeChange(
  snapshot: FinancialSnapshot,
  input: IncomeImpactInput,
): IncomeImpactResult {
  const { changePercent } = input;
  const { monthlyIncome, monthlyExpenses, outstandingInstallments, goals } =
    snapshot;

  const projectedIncome = Math.round(
    monthlyIncome * (1 + changePercent / 100),
  );

  const currentMonthlySavings = monthlyIncome - monthlyExpenses;
  const projectedMonthlySavings = projectedIncome - monthlyExpenses;

  const currentSavingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100
      : 0;

  const projectedSavingsRate =
    projectedIncome > 0
      ? Math.round(((projectedIncome - monthlyExpenses) / projectedIncome) * 10000) / 100
      : 0;

  // Debt coverage ratio
  const monthlyObligation = outstandingInstallments.reduce(
    (sum, inst) => sum + inst.monthlyAmount,
    0,
  );
  const debtCoverageRatio =
    projectedIncome > 0 ? monthlyObligation / projectedIncome : 0;

  const deficit = projectedMonthlySavings < 0;

  // Goal impacts
  const goalImpacts: GoalImpact[] = goals
    .filter((g) => g.remaining > 0)
    .map((g) => {
      const currentMonthsToGoal =
        currentMonthlySavings > 0
          ? Math.ceil(g.remaining / currentMonthlySavings)
          : null;

      const projectedMonthsToGoal =
        projectedMonthlySavings > 0
          ? Math.ceil(g.remaining / projectedMonthlySavings)
          : null;

      let changeMonths = 0;
      if (currentMonthsToGoal !== null && projectedMonthsToGoal !== null) {
        changeMonths = projectedMonthsToGoal - currentMonthsToGoal;
      }

      return {
        goalName: g.name,
        currentMonthsToGoal,
        projectedMonthsToGoal,
        changeMonths,
      };
    });

  return {
    currentIncome: monthlyIncome,
    projectedIncome,
    currentSavingsRate,
    projectedSavingsRate,
    currentMonthlySavings,
    projectedMonthlySavings,
    debtCoverageRatio,
    deficit,
    goalImpacts,
  };
}
