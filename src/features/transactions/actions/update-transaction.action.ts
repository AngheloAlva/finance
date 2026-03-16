"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { generateAlertsForTransaction } from "@/features/alerts/lib/alert-generation";
import type { TransactionAlertContext } from "@/features/alerts/types/alerts.types";
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries";
import { updateTransactionSchema } from "@/features/transactions/lib/transactions.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateTransactionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
    impactDate: formData.get("impactDate") || undefined,
    type: formData.get("type"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId"),
    creditCardId: formData.get("creditCardId") || undefined,
  };

  const result = updateTransactionSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, amount, description, notes, date, impactDate, type, paymentMethod, categoryId, creditCardId } =
    result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Transaction not found" };
    }

    if (existing.userId !== session.user.id) {
      return { success: false, error: "You can only edit your own transactions" };
    }

    if (existing.totalInstallments != null && existing.totalInstallments > 0) {
      const amountChanged = amount !== existing.amount;
      const dateChanged = date.getTime() !== existing.date.getTime();
      const impactDateChanged =
        impactDate != null &&
        existing.impactDate != null &&
        impactDate.getTime() !== existing.impactDate.getTime();

      if (amountChanged || dateChanged || impactDateChanged) {
        return {
          success: false,
          error:
            "Cannot modify amount or date of installment transactions. Delete the group and recreate instead.",
        };
      }
    }

    const categoryCheck = await assertCategoryAccess(categoryId, session.user.id);
    if (!categoryCheck.success) return categoryCheck;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        description,
        notes: notes ?? null,
        date,
        impactDate: impactDate ?? date,
        type,
        paymentMethod,
        categoryId,
        creditCardId: creditCardId ?? null,
      },
    });

    try {
      const alertContext: TransactionAlertContext = {
        transactionId: updated.id,
        categoryId,
        userId: session.user.id,
        impactDate: impactDate ?? date,
        amount,
        type,
        paymentMethod,
        creditCardId: updated.creditCardId,
      };
      await generateAlertsForTransaction(alertContext);
    } catch {
      // Fire-and-forget: never block transaction update
    }

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidateTag("alerts", { expire: 0 });

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update transaction" };
  }
}
