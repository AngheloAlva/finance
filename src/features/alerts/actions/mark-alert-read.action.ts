"use server";

import { revalidateTag } from "next/cache";

import { AlertStatus } from "@/generated/prisma/enums";
import { markAlertReadSchema } from "@/features/alerts/lib/alerts.schema";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function markAlertReadAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    alertId: formData.get("alertId"),
  };

  const result = markAlertReadSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: "FIELD_REQUIRED" };
  }

  const { alertId } = result.data;

  const session = await requireSession();

  try {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return { success: false, error: "ALERT_NOT_FOUND" };
    }

    if (alert.userId !== session.user.id) {
      return { success: false, error: "ALERT_NOT_OWNED" };
    }

    await prisma.alert.update({
      where: { id: alertId },
      data: { status: AlertStatus.READ },
    });

    revalidateTag("alerts", { expire: 0 });

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "ALERT_MARK_READ_FAILED" };
  }
}
