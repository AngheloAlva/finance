"use server";

import { revalidatePath } from "next/cache";

import { updateInvestmentSchema } from "@/features/investments/lib/investments.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateInvestmentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    type: formData.get("type"),
    name: formData.get("name"),
    institution: formData.get("institution"),
    currency: formData.get("currency") || "USD",
    startDate: formData.get("startDate"),
    maturityDate: formData.get("maturityDate") || undefined,
    estimatedReturn: formData.get("estimatedReturn") || undefined,
    isActive: formData.get("isActive") ?? undefined,
    totalFees: formData.get("totalFees") || undefined,
    purchaseExchangeRate: formData.get("purchaseExchangeRate") || undefined,
    currentExchangeRate: formData.get("currentExchangeRate") || undefined,
  };

  const result = updateInvestmentSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
    id,
    type,
    name,
    institution,
    currency,
    startDate,
    maturityDate,
    estimatedReturn,
    isActive,
    totalFees,
    purchaseExchangeRate,
    currentExchangeRate,
  } = result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Investment not found" };
    }

    if (existing.userId !== session.user.id) {
      return {
        success: false,
        error: "You can only edit your own investments",
      };
    }

    await prisma.investment.update({
      where: { id },
      data: {
        type,
        name,
        institution,
        currency,
        startDate,
        maturityDate,
        estimatedReturn,
        isActive,
        totalFees: totalFees ?? null,
        purchaseExchangeRate: purchaseExchangeRate ?? null,
        currentExchangeRate: currentExchangeRate ?? null,
      },
    });

    revalidatePath(`/investments/${id}`);
    revalidatePath("/investments");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update investment" };
  }
}
