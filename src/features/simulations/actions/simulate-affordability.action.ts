"use server";

import { computeAffordability } from "@/features/simulations/lib/affordability.compute";
import { affordabilityInputSchema } from "@/features/simulations/lib/simulations.schemas";
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import type { AffordabilityResult } from "@/features/simulations/types/simulations.types";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function simulateAffordabilityAction(
  _prevState: ActionResult<AffordabilityResult>,
  formData: FormData,
): Promise<ActionResult<AffordabilityResult>> {
  const raw = {
    purchaseAmount: formData.get("purchaseAmount"),
    installments: formData.get("installments") || "1",
    creditCardId: formData.get("creditCardId") || undefined,
    currencyCode: formData.get("currencyCode") || "USD",
  };

  const result = affordabilityInputSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const session = await requireSession();

  try {
    const snapshot = await getFinancialSnapshot(session.user.id);
    const simulation = computeAffordability(snapshot, result.data);
    return { success: true, data: simulation };
  } catch {
    return { success: false, error: "Failed to run affordability simulation" };
  }
}
