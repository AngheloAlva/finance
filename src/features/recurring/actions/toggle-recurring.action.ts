"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function toggleRecurringAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const id = formData.get("id");

  if (typeof id !== "string" || id.length === 0) {
    return { success: false, error: "FIELD_REQUIRED" };
  }

  const session = await requireSession();

  try {
    const template = await prisma.transaction.findUnique({
      where: { id },
      include: { recurrenceRule: true },
    });

    if (!template) {
      return { success: false, error: "RECURRING_NOT_FOUND" };
    }

    if (template.userId !== session.user.id) {
      return { success: false, error: "RECURRING_NOT_OWNED" };
    }

    if (!template.recurrenceRule) {
      return { success: false, error: "RECURRING_NO_RULE" };
    }

    await prisma.recurrenceRule.update({
      where: { id: template.recurrenceRule.id },
      data: { isActive: !template.recurrenceRule.isActive },
    });

    revalidatePath("/recurring");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "RECURRING_TOGGLE_FAILED" };
  }
}
