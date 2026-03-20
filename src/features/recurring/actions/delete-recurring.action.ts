"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteRecurringAction(
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
    });

    if (!template) {
      return { success: false, error: "RECURRING_NOT_FOUND" };
    }

    if (template.userId !== session.user.id) {
      return { success: false, error: "RECURRING_NOT_OWNED" };
    }

    // Delete template — RecurrenceRule cascades via onDelete: Cascade
    // Generated instances keep generatedFromId set to null via onDelete: SetNull
    await prisma.transaction.delete({ where: { id } });

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "RECURRING_DELETE_FAILED" };
  }
}
