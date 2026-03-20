"use server";

import { computeIncomeChange } from "@/features/simulations/lib/income-impact.compute";
import { incomeChangeInputSchema } from "@/features/simulations/lib/simulations.schemas";
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import type { IncomeImpactResult } from "@/features/simulations/types/simulations.types";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function simulateIncomeChangeAction(
  _prevState: ActionResult<IncomeImpactResult>,
  formData: FormData,
): Promise<ActionResult<IncomeImpactResult>> {
  const raw = {
    changePercent: formData.get("changePercent"),
  };

  const result = incomeChangeInputSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const session = await requireSession();

  try {
    const snapshot = await getFinancialSnapshot(session.user.id);
    const simulation = computeIncomeChange(snapshot, result.data);
    return { success: true, data: simulation };
  } catch {
    return {
      success: false,
      error: "SIMULATION_INCOME_CHANGE_FAILED",
    };
  }
}
