"use server";

import { revalidatePath } from "next/cache";

import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteCreditCardAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const card = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!card) {
      return { success: false, error: "Credit card not found" };
    }

    if (card.userId !== session.user.id) {
      return { success: false, error: "You can only delete your own credit cards" };
    }

    const linkedTransactions = await prisma.transaction.count({
      where: { creditCardId: id },
    });

    if (linkedTransactions > 0) {
      return {
        success: false,
        error: `Cannot delete this card. It has ${linkedTransactions} linked transaction${linkedTransactions === 1 ? "" : "s"}. Remove or reassign them first.`,
      };
    }

    await prisma.creditCard.delete({ where: { id } });

    revalidatePath("/credit-cards");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete credit card" };
  }
}
