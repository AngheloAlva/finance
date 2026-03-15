export interface MonthlyOverview {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  percentage: number;
}

export interface MonthlyFlowItem {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  absoluteReturn: number;
  returnPercentage: number;
  count: number;
}
