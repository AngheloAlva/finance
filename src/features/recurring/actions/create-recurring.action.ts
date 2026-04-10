"use server";

import { revalidatePath } from "next/cache";

import { assertCategoryAccess } from "@/features/categories/lib/categories.queries";
import { createRecurringSchema } from "@/features/recurring/lib/recurring.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createRecurringAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
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

  const result = createRecurringSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
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
    const categoryCheck = await assertCategoryAccess(categoryId, session.user.id);
    if (!categoryCheck.success) return categoryCheck;

    await prisma.$transaction(async (tx) => {
      const template = await tx.transaction.create({
        data: {
          amount,
          description,
          notes: notes ?? null,
          date: startDate,
          impactDate: startDate,
          type,
          paymentMethod,
          categoryId,
          userId: session.user.id,
          isTemplate: true,
        },
      });

      await tx.recurrenceRule.create({
        data: {
          frequency,
          interval,
          generationMode,
          nextGenerationDate: startDate,
          endDate: endDate ?? null,
          isActive: true,
          transactionId: template.id,
        },
      });
    });

    revalidatePath("/recurring");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "RECURRING_CREATE_FAILED" };
  }
}
