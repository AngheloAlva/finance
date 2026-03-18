"use server";

import { revalidatePath } from "next/cache";

import { createInvestmentSchema } from "@/features/investments/lib/investments.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createInvestmentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    type: formData.get("type"),
    name: formData.get("name"),
    institution: formData.get("institution"),
    initialAmount: formData.get("initialAmount"),
    currency: formData.get("currency") || "USD",
    startDate: formData.get("startDate"),
    maturityDate: formData.get("maturityDate") || undefined,
    estimatedReturn: formData.get("estimatedReturn") || undefined,
    purchaseExchangeRate: formData.get("purchaseExchangeRate") || undefined,
    currentExchangeRate: formData.get("currentExchangeRate") || undefined,
    totalFees: formData.get("totalFees") || undefined,
  };

  const result = createInvestmentSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
    type,
    name,
    institution,
    initialAmount,
    currency,
    startDate,
    maturityDate,
    estimatedReturn,
    purchaseExchangeRate,
    currentExchangeRate,
    totalFees,
  } = result.data;

  const session = await requireSession();

  try {
    await prisma.investment.create({
      data: {
        type,
        name,
        institution,
        initialAmount,
        currentValue: initialAmount,
        currency,
        startDate,
        maturityDate,
        estimatedReturn,
        purchaseExchangeRate: purchaseExchangeRate ?? null,
        currentExchangeRate: currentExchangeRate ?? purchaseExchangeRate ?? null,
        totalFees: totalFees ?? null,
        userId: session.user.id,
      },
    });

    revalidatePath("/investments");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to create investment" };
  }
}
