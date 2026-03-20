"use server";

import { computeBudgetOptimizer } from "@/features/simulations/lib/budget-optimizer.compute";
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import type { BudgetOptimizerResult } from "@/features/simulations/types/simulations.types";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function simulateBudgetOptimizerAction(
  _prevState: ActionResult<BudgetOptimizerResult>,
): Promise<ActionResult<BudgetOptimizerResult>> {
  const session = await requireSession();

  try {
    const snapshot = await getFinancialSnapshot(session.user.id);
    const simulation = computeBudgetOptimizer(snapshot);
    return { success: true, data: simulation };
  } catch {
    return {
      success: false,
      error: "SIMULATION_BUDGET_OPTIMIZER_FAILED",
    };
  }
}
