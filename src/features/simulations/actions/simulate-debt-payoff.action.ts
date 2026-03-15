"use server";

import { computeDebtPayoff } from "@/features/simulations/lib/debt-payoff.compute";
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import type { DebtPayoffResult } from "@/features/simulations/types/simulations.types";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function simulateDebtPayoffAction(
  _prevState: ActionResult<DebtPayoffResult>,
): Promise<ActionResult<DebtPayoffResult>> {
  const session = await requireSession();

  try {
    const snapshot = await getFinancialSnapshot(session.user.id);
    const simulation = computeDebtPayoff(snapshot);
    return { success: true, data: simulation };
  } catch {
    return { success: false, error: "Failed to run debt payoff simulation" };
  }
}
