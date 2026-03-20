"use server";

import { revalidatePath } from "next/cache";

import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteTransactionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return { success: false, error: "TRANSACTION_NOT_FOUND" };
    }

    if (transaction.userId !== session.user.id) {
      return { success: false, error: "TRANSACTION_NOT_OWNED" };
    }

    await prisma.transaction.delete({ where: { id } });

    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "TRANSACTION_DELETE_FAILED" };
  }
}
