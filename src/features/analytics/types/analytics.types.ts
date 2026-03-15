export interface DateRange {
  from: Date;
  to: Date;
}

export interface TrendPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  netSavings: number;
}

export interface ForecastPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  netFlow: number;
  isProjected: boolean;
}

export interface CategoryComparisonItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  period1Total: number;
  period2Total: number;
  change: number;
}

export interface DailySpendingItem {
  date: string;
  total: number;
  count: number;
}

export interface NetWorthPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface BudgetVsActualItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budget: number;
  actual: number;
  percentage: number;
}

export interface HealthScoreFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface HealthScoreResult {
  overall: number;
  factors: HealthScoreFactor[];
  label: string;
  hasEnoughData: boolean;
}

export interface DateRangePreset {
  label: string;
  value: string;
  from: Date;
  to: Date;
}
