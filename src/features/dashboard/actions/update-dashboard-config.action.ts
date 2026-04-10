"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

import {
  dashboardConfigSchema,
  type DashboardConfig,
} from "@/features/dashboard/lib/dashboard.schema";

/**
 * Direct-call server action (not a form action). Persists the user's
 * dashboard customization to User.dashboardConfig and revalidates the
 * dashboard page.
 */
export async function updateDashboardConfigAction(
  config: DashboardConfig,
): Promise<ActionResult<void>> {
  const result = dashboardConfigSchema.safeParse(config);
  if (!result.success) {
    return { success: false, error: "DASHBOARD_CONFIG_INVALID" };
  }

  const session = await requireSession();

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { dashboardConfig: result.data },
    });

    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "DASHBOARD_CONFIG_UPDATE_FAILED" };
  }
}
