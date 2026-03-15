"use server";

import { savingsGoalInputSchema } from "@/features/simulations/lib/simulations.schemas";
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import { computeSavingsGoal } from "@/features/simulations/lib/savings-projection.compute";
import type { SavingsProjectionResult } from "@/features/simulations/types/simulations.types";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function simulateSavingsGoalAction(
  _prevState: ActionResult<SavingsProjectionResult>,
  formData: FormData,
): Promise<ActionResult<SavingsProjectionResult>> {
  const raw = {
    goalId: formData.get("goalId"),
    adjustedMonthlyContribution:
      formData.get("adjustedMonthlyContribution") || undefined,
  };

  const result = savingsGoalInputSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const session = await requireSession();

  try {
    const snapshot = await getFinancialSnapshot(session.user.id);

    // Validate goal belongs to user
    const goal = snapshot.goals.find((g) => g.id === result.data.goalId);
    if (!goal) {
      return { success: false, error: "Goal not found" };
    }

    const simulation = computeSavingsGoal(snapshot, result.data);
    return { success: true, data: simulation };
  } catch {
    return { success: false, error: "Failed to run savings goal simulation" };
  }
}
