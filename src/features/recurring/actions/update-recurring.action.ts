"use server";

import { revalidatePath } from "next/cache";

import { assertCategoryAccess } from "@/features/categories/lib/categories.queries";
import { updateRecurringSchema } from "@/features/recurring/lib/recurring.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateRecurringAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    type: formData.get("type"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId"),
    frequency: formData.get("frequency"),
    interval: formData.get("interval"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    generationMode: formData.get("generationMode") || undefined,
  };

  const result = updateRecurringSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
    id,
    amount,
    description,
    notes,
    type,
    paymentMethod,
    categoryId,
    frequency,
    interval,
    startDate,
    endDate,
    generationMode,
  } = result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { recurrenceRule: true },
    });

    if (!existing) {
      return { success: false, error: "RECURRING_NOT_FOUND" };
    }

    if (existing.userId !== session.user.id) {
      return { success: false, error: "RECURRING_NOT_OWNED" };
    }

    if (!existing.recurrenceRule) {
      return { success: false, error: "RECURRING_NO_RULE" };
    }

    const categoryCheck = await assertCategoryAccess(categoryId, session.user.id);
    if (!categoryCheck.success) return categoryCheck;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: {
          amount,
          description,
          notes: notes ?? null,
          date: startDate,
          impactDate: startDate,
          type,
          paymentMethod,
          categoryId,
        },
      });

      await tx.recurrenceRule.update({
        where: { id: existing.recurrenceRule!.id },
        data: {
          frequency,
          interval,
          generationMode,
          nextGenerationDate: startDate,
          endDate: endDate ?? null,
        },
      });
    });

    revalidatePath("/recurring");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "RECURRING_UPDATE_FAILED" };
  }
}
