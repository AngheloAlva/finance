"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteInvestmentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      return { success: false, error: "INVESTMENT_NOT_FOUND" };
    }

    if (investment.userId !== session.user.id) {
      return {
        success: false,
        error: "INVESTMENT_NOT_OWNED",
      };
    }

    await prisma.investment.delete({ where: { id } });

    revalidatePath("/investments");
    revalidatePath("/");
  } catch {
    return { success: false, error: "INVESTMENT_DELETE_FAILED" };
  }

  redirect("/investments");
}
