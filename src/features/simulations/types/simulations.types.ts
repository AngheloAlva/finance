// ─── Financial Snapshot (shared input for all simulators) ─────────────

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  isAvoidable: boolean;
  isRecurring: boolean;
  alertThreshold: number | null;
  monthlyAverage: number; // cents
}

export interface CreditCardSnapshot {
  id: string;
  name: string;
  lastFourDigits: string;
  totalLimit: number; // cents
  usedLimit: number; // cents
  availableLimit: number; // cents
  closingDay: number;
  paymentDay: number;
}

export interface OutstandingInstallment {
  parentTransactionId: string;
  description: string;
  creditCardId: string | null;
  remainingPayments: number;
  monthlyAmount: number; // cents per installment
  totalRemaining: number; // cents sum of remaining
}

export interface RecurringObligation {
  id: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  monthlyAmount: number; // cents, normalized
}

export interface GoalSnapshot {
  id: string;
  name: string;
  targetAmount: number; // cents
  currentAmount: number; // cents
  targetDate: Date | null;
  remaining: number; // cents
}

export interface FinancialSnapshot {
  monthlyIncome: number; // cents, avg last N months
  monthlyExpenses: number; // cents, avg last N months
  expensesByCategory: CategoryExpense[];
  creditCards: CreditCardSnapshot[];
  outstandingInstallments: OutstandingInstallment[];
  recurringObligations: RecurringObligation[];
  goals: GoalSnapshot[];
  totalInvestmentValue: number; // cents
  dataMonths: number;
  isLimitedData: boolean;
}

// ─── Simulator Inputs ────────────────────────────────────────────────

export interface AffordabilityInput {
  purchaseAmount: number; // cents
  installments: number; // 1 = single payment, 2-48 = installments
  creditCardId?: string;
}

export interface SavingsProjectionInput {
  goalId: string;
  adjustedMonthlyContribution?: number; // cents
}

// Debt Payoff — no user input beyond snapshot

export interface IncomeImpactInput {
  changePercent: number; // e.g. 10 = +10%, -20 = -20%
}

// Budget Optimizer — no user input beyond snapshot

// ─── Simulator Outputs ───────────────────────────────────────────────

export interface CashFlowMonth {
  month: string; // "2026-04"
  label: string; // "Apr"
  income: number;
  expenses: number;
  balanceWithPurchase: number;
  balanceWithout: number;
}

export interface CreditCardImpact {
  cardName: string;
  currentUtilization: number; // 0-100
  projectedUtilization: number; // 0-100
  exceedsLimit: boolean;
}

export interface AffordabilityResult {
  canAfford: boolean;
  monthlyImpact: number; // cents added to monthly expenses
  currentMonthlyBalance: number; // cents (income - expenses)
  projectedMonthlyBalance: number; // cents (after purchase)
  creditCardImpact: CreditCardImpact | null;
  cashFlowProjection: CashFlowMonth[];
  budgetWarning: boolean;
}

export interface SavingsTimelineMonth {
  month: string;
  projected: number; // cumulative (current rate)
  adjusted: number; // cumulative (adjusted rate)
  target: number;
}

export interface SavingsProjectionResult {
  currentMonthlySavings: number; // cents
  currentMonthsToGoal: number | null; // null if savings <= 0
  adjustedMonthsToGoal: number | null;
  currentTargetDate: Date | null;
  adjustedTargetDate: Date | null;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  goalAlreadyMet: boolean;
  onTrack: boolean | null; // null if no target date
  timeline: SavingsTimelineMonth[];
}

export interface InstallmentGroup {
  description: string;
  remainingPayments: number;
  monthlyAmount: number;
  totalRemaining: number;
  projectedPayoffDate: Date;
}

export interface DebtPayoffResult {
  totalDebt: number; // cents
  monthlyObligation: number; // cents
  installmentGroups: InstallmentGroup[];
  debtFreeDate: Date | null;
  totalCost: number;
  debtCoverageRatio: number; // 0-1
  highDebtRatio: boolean;
}

export interface GoalImpact {
  goalName: string;
  currentMonthsToGoal: number | null;
  projectedMonthsToGoal: number | null;
  changeMonths: number; // positive = slower, negative = faster
}

export interface IncomeImpactResult {
  currentIncome: number;
  projectedIncome: number;
  currentSavingsRate: number; // 0-100 percentage
  projectedSavingsRate: number;
  currentMonthlySavings: number;
  projectedMonthlySavings: number;
  debtCoverageRatio: number;
  deficit: boolean;
  goalImpacts: GoalImpact[];
}

export interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  isAvoidable: boolean;
  monthlyAverage: number;
  percentOfTotal: number; // 0-100
  alertThreshold: number | null;
  exceedsThreshold: boolean;
  suggestion: string | null;
}

export interface BudgetOptimizerResult {
  totalMonthlyExpenses: number;
  avoidableExpenses: number;
  nonAvoidableExpenses: number;
  monthlyIncome: number;
  savingsRate: number; // current, 0-100
  potentialSavingsRate: number; // if avoidable eliminated, 0-100
  categories: CategoryAnalysis[];
  reductionScenarios: Array<{
    label: string;
    percent: number;
    monthlySavings: number;
    newSavingsRate: number;
  }>;
}
