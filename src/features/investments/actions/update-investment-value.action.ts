"use server";

import { revalidatePath } from "next/cache";

import { updateInvestmentValueSchema } from "@/features/investments/lib/investments.schema";
import { checkInvestmentAlerts } from "@/features/alerts/lib/alert-generation";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateInvestmentValueAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    currentValue: formData.get("currentValue"),
  };

  const result = updateInvestmentValueSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, currentValue: newValue } = result.data;

  const session = await requireSession();

  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      return { success: false, error: "Investment not found" };
    }

    if (investment.userId !== session.user.id) {
      return {
        success: false,
        error: "You can only update your own investments",
      };
    }

    // Skip snapshot if value hasn't changed
    if (investment.currentValue === newValue) {
      return { success: true, data: undefined };
    }

    await prisma.$transaction([
      prisma.investmentSnapshot.create({
        data: {
          investmentId: investment.id,
          date: new Date(),
          value: investment.currentValue,
        },
      }),
      prisma.investment.update({
        where: { id: investment.id },
        data: { currentValue: newValue },
      }),
    ]);

    // Fire-and-forget: check investment alerts
    try {
      await checkInvestmentAlerts(investment.id, session.user.id);
    } catch {
      // Never block investment update flow
    }

    revalidatePath(`/investments/${investment.id}`);
    revalidatePath("/investments");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update investment value" };
  }
}
