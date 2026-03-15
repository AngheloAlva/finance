"use server";

import { revalidateTag } from "next/cache";

import { AlertStatus } from "@/generated/prisma/enums";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function markAllReadAction(): Promise<ActionResult<{ count: number }>> {
  const session = await requireSession();

  try {
    const result = await prisma.alert.updateMany({
      where: { userId: session.user.id, status: AlertStatus.PENDING },
      data: { status: AlertStatus.READ },
    });

    revalidateTag("alerts", { expire: 0 });

    return { success: true, data: { count: result.count } };
  } catch {
    return { success: false, error: "Failed to mark alerts as read" };
  }
}
