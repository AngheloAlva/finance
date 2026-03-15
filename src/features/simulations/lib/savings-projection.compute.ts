import type {
  FinancialSnapshot,
  SavingsProjectionInput,
  SavingsProjectionResult,
  SavingsTimelineMonth,
} from "@/features/simulations/types/simulations.types";

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function computeSavingsGoal(
  snapshot: FinancialSnapshot,
  input: SavingsProjectionInput,
): SavingsProjectionResult {
  const { goalId, adjustedMonthlyContribution } = input;
  const goal = snapshot.goals.find((g) => g.id === goalId);

  if (!goal) {
    return {
      currentMonthlySavings: 0,
      currentMonthsToGoal: null,
      adjustedMonthsToGoal: null,
      currentTargetDate: null,
      adjustedTargetDate: null,
      goalName: "Unknown Goal",
      targetAmount: 0,
      currentAmount: 0,
      remaining: 0,
      goalAlreadyMet: false,
      onTrack: null,
      timeline: [],
    };
  }

  const { monthlyIncome, monthlyExpenses } = snapshot;
  const currentMonthlySavings = monthlyIncome - monthlyExpenses;
  const remaining = goal.remaining;

  // Goal already met
  if (remaining <= 0) {
    return {
      currentMonthlySavings,
      currentMonthsToGoal: 0,
      adjustedMonthsToGoal: 0,
      currentTargetDate: null,
      adjustedTargetDate: null,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining: 0,
      goalAlreadyMet: true,
      onTrack: true,
      timeline: [],
    };
  }

  // Current rate
  const currentMonthsToGoal =
    currentMonthlySavings > 0
      ? Math.ceil(remaining / currentMonthlySavings)
      : null;

  // Adjusted rate
  const adjustedSavings = adjustedMonthlyContribution ?? currentMonthlySavings;
  const adjustedMonthsToGoal =
    adjustedSavings > 0 ? Math.ceil(remaining / adjustedSavings) : null;

  const now = new Date();
  const currentTargetDate =
    currentMonthsToGoal !== null
      ? addMonthsToDate(now, currentMonthsToGoal)
      : null;
  const adjustedTargetDate =
    adjustedMonthsToGoal !== null
      ? addMonthsToDate(now, adjustedMonthsToGoal)
      : null;

  // On track check
  let onTrack: boolean | null = null;
  if (goal.targetDate && currentTargetDate) {
    onTrack = currentTargetDate <= goal.targetDate;
  }

  // Build timeline (max 36 months or until both rates reach target)
  const maxMonths = Math.min(
    Math.max(currentMonthsToGoal ?? 36, adjustedMonthsToGoal ?? 36, 6),
    36,
  );

  const timeline: SavingsTimelineMonth[] = [];
  for (let i = 1; i <= maxMonths; i++) {
    const monthDate = addMonthsToDate(now, i);
    const projected = Math.min(
      goal.currentAmount + (currentMonthlySavings > 0 ? currentMonthlySavings * i : 0),
      goal.targetAmount,
    );
    const adjusted = Math.min(
      goal.currentAmount + (adjustedSavings > 0 ? adjustedSavings * i : 0),
      goal.targetAmount,
    );

    timeline.push({
      month: formatMonthKey(monthDate),
      projected,
      adjusted,
      target: goal.targetAmount,
    });
  }

  return {
    currentMonthlySavings,
    currentMonthsToGoal,
    adjustedMonthsToGoal,
    currentTargetDate,
    adjustedTargetDate,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remaining,
    goalAlreadyMet: false,
    onTrack,
    timeline,
  };
}
