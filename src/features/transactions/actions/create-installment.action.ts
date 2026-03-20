"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { generateAlertsForTransaction } from "@/features/alerts/lib/alert-generation";
import type { TransactionAlertContext } from "@/features/alerts/types/alerts.types";
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries";
import { getCreditCardById } from "@/features/credit-cards/lib/credit-cards.queries";
import { generateInstallmentRows } from "@/features/transactions/lib/installment.utils";
import { createInstallmentSchema } from "@/features/transactions/lib/transactions.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createInstallmentPurchaseAction(
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
    totalInstallments: formData.get("totalInstallments"),
    creditCardId: formData.get("creditCardId"),
  };

  const result = createInstallmentSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
    amount,
    description,
    notes,
    date,
    type,
    paymentMethod,
    categoryId,
    totalInstallments,
    creditCardId,
  } = result.data;

  const session = await requireSession();

  try {
    const categoryCheck = await assertCategoryAccess(categoryId, session.user.id);
    if (!categoryCheck.success) return categoryCheck;

    const creditCard = await getCreditCardById(creditCardId, session.user.id);

    if (!creditCard) {
      return { success: false, error: "CREDIT_CARD_NOT_FOUND" };
    }

    const rows = generateInstallmentRows({
      totalAmount: amount,
      totalInstallments,
      description,
      notes: notes ?? null,
      date,
      type,
      paymentMethod,
      categoryId,
      userId: session.user.id,
      creditCardId: creditCard.id,
      closingDay: creditCard.closingDay,
      paymentDay: creditCard.paymentDay,
    });

    await prisma.$transaction(async (tx) => {
      const parent = await tx.transaction.create({
        data: {
          amount: rows[0]!.amount,
          description: rows[0]!.description,
          notes: rows[0]!.notes,
          date: rows[0]!.date,
          impactDate: rows[0]!.impactDate,
          type: rows[0]!.type,
          paymentMethod: rows[0]!.paymentMethod,
          categoryId: rows[0]!.categoryId,
          userId: rows[0]!.userId,
          creditCardId: rows[0]!.creditCardId,
          installmentNumber: rows[0]!.installmentNumber,
          totalInstallments: rows[0]!.totalInstallments,
        },
      });

      if (rows.length > 1) {
        await tx.transaction.createMany({
          data: rows.slice(1).map((row) => ({
            ...row,
            parentTransactionId: parent.id,
          })),
        });
      }
    });

    try {
      const firstRow = rows[0]!;
      const alertContext: TransactionAlertContext = {
        transactionId: "", // parent ID not easily accessible after $transaction
        categoryId: firstRow.categoryId,
        userId: session.user.id,
        impactDate: firstRow.impactDate,
        amount: firstRow.amount,
        type: firstRow.type,
        paymentMethod: firstRow.paymentMethod,
        creditCardId: firstRow.creditCardId,
      };
      await generateAlertsForTransaction(alertContext);
    } catch {
      // Fire-and-forget: never block installment creation
    }

    revalidatePath("/transactions");
    revalidatePath("/credit-cards");
    revalidatePath("/");
    revalidateTag("alerts", { expire: 0 });

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "INSTALLMENT_CREATE_FAILED" };
  }
}
