"use server";

import { revalidatePath } from "next/cache";

import { generatePendingRecurring } from "@/features/recurring/lib/generate-recurring";
import { requireSession } from "@/shared/lib/auth";
import type { ActionResult } from "@/shared/types/common.types";

export async function generateRecurringAction(): Promise<
  ActionResult<{ count: number }>
> {
  const session = await requireSession();

  try {
    const count = await generatePendingRecurring(session.user.id);

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/recurring");

    return { success: true, data: { count } };
  } catch {
    return { success: false, error: "Failed to generate recurring transactions" };
  }
}
