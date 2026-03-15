import type {
  AffordabilityInput,
  AffordabilityResult,
  CashFlowMonth,
  CreditCardImpact,
  FinancialSnapshot,
} from "@/features/simulations/types/simulations.types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()]!;
}

export function computeAffordability(
  snapshot: FinancialSnapshot,
  input: AffordabilityInput,
): AffordabilityResult {
  const { purchaseAmount, installments, creditCardId } = input;
  const { monthlyIncome, monthlyExpenses } = snapshot;

  // Monthly impact: how much this adds to monthly expenses
  const monthlyImpact =
    installments > 1
      ? Math.round(purchaseAmount / installments)
      : purchaseAmount;

  const currentMonthlyBalance = monthlyIncome - monthlyExpenses;
  const projectedMonthlyBalance = currentMonthlyBalance - monthlyImpact;

  // Credit card impact
  let creditCardImpact: CreditCardImpact | null = null;

  if (creditCardId) {
    const card = snapshot.creditCards.find((c) => c.id === creditCardId);
    if (card) {
      const currentUtilization =
        card.totalLimit > 0
          ? Math.round((card.usedLimit / card.totalLimit) * 100)
          : 0;
      const projectedUsed = card.usedLimit + purchaseAmount;
      const projectedUtilization =
        card.totalLimit > 0
          ? Math.round((projectedUsed / card.totalLimit) * 100)
          : 0;
      creditCardImpact = {
        cardName: card.name,
        currentUtilization,
        projectedUtilization,
        exceedsLimit: projectedUsed > card.totalLimit,
      };
    }
  }

  // 3-month cash flow projection
  const now = new Date();
  const cashFlowProjection: CashFlowMonth[] = [];

  for (let i = 0; i < 3; i++) {
    const projDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const balanceWithout = monthlyIncome - monthlyExpenses;

    let purchaseExpenseThisMonth = 0;
    if (installments <= 1) {
      // Single payment: only impacts first month
      purchaseExpenseThisMonth = i === 0 ? purchaseAmount : 0;
    } else {
      // Installment: impacts months within the installment window
      purchaseExpenseThisMonth = i < installments ? monthlyImpact : 0;
    }

    const balanceWithPurchase = balanceWithout - purchaseExpenseThisMonth;

    cashFlowProjection.push({
      month: formatMonthKey(projDate),
      label: formatMonthLabel(projDate),
      income: monthlyIncome,
      expenses: monthlyExpenses + purchaseExpenseThisMonth,
      balanceWithPurchase,
      balanceWithout,
    });
  }

  const canAfford = projectedMonthlyBalance >= 0;
  const budgetWarning = currentMonthlyBalance <= 0 || projectedMonthlyBalance < 0;

  return {
    canAfford,
    monthlyImpact,
    currentMonthlyBalance,
    projectedMonthlyBalance,
    creditCardImpact,
    cashFlowProjection,
    budgetWarning,
  };
}
