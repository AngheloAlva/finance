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
    return { success: false, error: "Template ID is required" };
  }

  const session = await requireSession();

  try {
    const template = await prisma.transaction.findUnique({
      where: { id },
      include: { recurrenceRule: true },
    });

    if (!template) {
      return { success: false, error: "Recurring template not found" };
    }

    if (template.userId !== session.user.id) {
      return { success: false, error: "You can only modify your own templates" };
    }

    if (!template.recurrenceRule) {
      return { success: false, error: "This transaction has no recurrence rule" };
    }

    await prisma.recurrenceRule.update({
      where: { id: template.recurrenceRule.id },
      data: { isActive: !template.recurrenceRule.isActive },
    });

    revalidatePath("/recurring");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to toggle recurring status" };
  }
}
