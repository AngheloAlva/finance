"use server";

import { revalidatePath } from "next/cache";

import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteInstallmentGroupAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData, "parentTransactionId");
  if (!idResult.success) return idResult;
  const parentTransactionId = idResult.data;

  const session = await requireSession();

  try {
    const parentTransaction = await prisma.transaction.findUnique({
      where: { id: parentTransactionId },
    });

    if (!parentTransaction) {
      return { success: false, error: "Installment group not found" };
    }

    if (parentTransaction.userId !== session.user.id) {
      return {
        success: false,
        error: "You can only delete your own transactions",
      };
    }

    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { parentTransactionId },
          { id: parentTransactionId },
        ],
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/credit-cards");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete installment group" };
  }
}
