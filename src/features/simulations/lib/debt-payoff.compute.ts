import type {
  DebtPayoffResult,
  FinancialSnapshot,
  InstallmentGroup,
} from "@/features/simulations/types/simulations.types";

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function computeDebtPayoff(
  snapshot: FinancialSnapshot,
): DebtPayoffResult {
  const { outstandingInstallments, monthlyIncome } = snapshot;

  if (outstandingInstallments.length === 0) {
    return {
      totalDebt: 0,
      monthlyObligation: 0,
      installmentGroups: [],
      debtFreeDate: null,
      totalCost: 0,
      debtCoverageRatio: 0,
      highDebtRatio: false,
    };
  }

  const now = new Date();

  const installmentGroups: InstallmentGroup[] = outstandingInstallments.map(
    (inst) => ({
      description: inst.description,
      remainingPayments: inst.remainingPayments,
      monthlyAmount: inst.monthlyAmount,
      totalRemaining: inst.totalRemaining,
      projectedPayoffDate: addMonthsToDate(now, inst.remainingPayments),
    }),
  );

  const totalDebt = installmentGroups.reduce(
    (sum, g) => sum + g.totalRemaining,
    0,
  );

  const monthlyObligation = installmentGroups.reduce(
    (sum, g) => sum + g.monthlyAmount,
    0,
  );

  // Debt-free date: the latest payoff date across all groups
  const debtFreeDate =
    installmentGroups.length > 0
      ? installmentGroups.reduce(
          (latest, g) =>
            g.projectedPayoffDate > latest ? g.projectedPayoffDate : latest,
          installmentGroups[0]!.projectedPayoffDate,
        )
      : null;

  const totalCost = totalDebt; // For installments, total cost = sum of remaining payments

  const debtCoverageRatio =
    monthlyIncome > 0 ? monthlyObligation / monthlyIncome : 0;

  const highDebtRatio = debtCoverageRatio > 0.3;

  return {
    totalDebt,
    monthlyObligation,
    installmentGroups,
    debtFreeDate,
    totalCost,
    debtCoverageRatio,
    highDebtRatio,
  };
}
