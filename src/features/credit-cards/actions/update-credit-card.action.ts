"use server";

import { revalidatePath } from "next/cache";

import { updateCreditCardSchema } from "@/features/credit-cards/lib/credit-cards.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateCreditCardAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    lastFourDigits: formData.get("lastFourDigits"),
    brand: formData.get("brand"),
    totalLimit: formData.get("totalLimit"),
    closingDay: formData.get("closingDay"),
    paymentDay: formData.get("paymentDay"),
    color: formData.get("color"),
  };

  const result = updateCreditCardSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, name, lastFourDigits, brand, totalLimit, closingDay, paymentDay, color } =
    result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "CREDIT_CARD_NOT_FOUND" };
    }

    if (existing.userId !== session.user.id) {
      return { success: false, error: "CREDIT_CARD_NOT_OWNED" };
    }

    await prisma.creditCard.update({
      where: { id },
      data: {
        name,
        lastFourDigits,
        brand,
        totalLimit,
        closingDay,
        paymentDay,
        color,
      },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "CREDIT_CARD_UPDATE_FAILED" };
  }
}
