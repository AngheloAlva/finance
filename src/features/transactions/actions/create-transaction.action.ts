"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { generateAlertsForTransaction } from "@/features/alerts/lib/alert-generation";
import type { TransactionAlertContext } from "@/features/alerts/types/alerts.types";
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries";
import { createTransactionSchema } from "@/features/transactions/lib/transactions.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createTransactionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    amount: formData.get("amount"),
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
    impactDate: formData.get("impactDate") || undefined,
    type: formData.get("type"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId"),
  };

  const result = createTransactionSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { amount, description, notes, date, impactDate, type, paymentMethod, categoryId } =
    result.data;

  const session = await requireSession();

  try {
    const categoryCheck = await assertCategoryAccess(categoryId, session.user.id);
    if (!categoryCheck.success) return categoryCheck;

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        description,
        notes: notes ?? null,
        date,
        impactDate: impactDate ?? date,
        type,
        paymentMethod,
        categoryId,
        userId: session.user.id,
      },
    });

    try {
      const alertContext: TransactionAlertContext = {
        transactionId: transaction.id,
        categoryId,
        userId: session.user.id,
        impactDate: impactDate ?? date,
        amount,
        type,
        paymentMethod,
        creditCardId: null,
      };
      await generateAlertsForTransaction(alertContext);
    } catch {
      // Fire-and-forget: never block transaction creation
    }

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidateTag("alerts", { expire: 0 });

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to create transaction" };
  }
}
