"use server";

import { revalidatePath } from "next/cache";

import { createCreditCardSchema } from "@/features/credit-cards/lib/credit-cards.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createCreditCardAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    lastFourDigits: formData.get("lastFourDigits"),
    brand: formData.get("brand"),
    totalLimit: formData.get("totalLimit"),
    closingDay: formData.get("closingDay"),
    paymentDay: formData.get("paymentDay"),
    color: formData.get("color"),
  };

  const result = createCreditCardSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, lastFourDigits, brand, totalLimit, closingDay, paymentDay, color } =
    result.data;

  const session = await requireSession();

  try {
    await prisma.creditCard.create({
      data: {
        name,
        lastFourDigits,
        brand,
        totalLimit,
        closingDay,
        paymentDay,
        color,
        userId: session.user.id,
      },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "CREDIT_CARD_CREATE_FAILED" };
  }
}
