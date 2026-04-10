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

export const CHANGE_DIRECTION = {
  UP: "up",
  DOWN: "down",
  FLAT: "flat",
} as const;

export type ChangeDirection = (typeof CHANGE_DIRECTION)[keyof typeof CHANGE_DIRECTION];

export interface MonthComparisonItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  currentAmount: number;
  previousAmount: number;
  changePercent: number;
  direction: ChangeDirection;
}

export interface TrendAlert {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  monthlyAmounts: number[];
  totalIncreasePercent: number;
}

export interface MonthComparisonResult {
  items: MonthComparisonItem[];
  trends: TrendAlert[];
  totalCurrentMonth: number;
  totalPreviousMonth: number;
  overallChangePercent: number;
  overallDirection: ChangeDirection;
}

// ---------- Cashflow Projection (30/60/90) ----------

export type ProjectionEventSource = "EXISTING" | "RECURRING";
export type ProjectionEventType = "INCOME" | "EXPENSE";

export interface ProjectionEvent {
  date: string; // YYYY-MM-DD (impactDate)
  amount: number; // signed cents: positive = inflow, negative = outflow
  description: string;
  source: ProjectionEventSource;
  transactionType: ProjectionEventType;
}

export interface ProjectionPoint {
  date: string; // YYYY-MM-DD
  dayOffset: number; // 0 = today, 1 = tomorrow, ...
  balance: number; // running balance in cents
  dayInflow: number; // cents
  dayOutflow: number; // cents (positive)
  isNegative: boolean;
}

export interface LowestPoint {
  date: string;
  balance: number;
  dayOffset: number;
}

export interface ProjectionSummary {
  startingBalance: number;
  balance30: number;
  balance60: number;
  balance90: number;
  lowestPoint: LowestPoint | null;
  willGoNegative: boolean;
  firstNegativeDate: string | null;
  totalDays: number;
}

export interface ProjectionResult {
  points: ProjectionPoint[];
  summary: ProjectionSummary;
  events: ProjectionEvent[];
}
