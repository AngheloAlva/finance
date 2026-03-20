"use server";

import { revalidatePath } from "next/cache";

import { GoalStatus, GroupRole } from "@/generated/prisma/enums";
import { updateGoalSchema } from "@/features/goals/lib/goals.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateGoalAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate") || undefined,
    groupId: formData.get("groupId") || undefined,
    status: formData.get("status") || undefined,
  };

  const result = updateGoalSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, name, description, targetAmount, targetDate, status } =
    result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.goal.findUnique({ where: { id } });

    if (!existing) {
      return { success: false, error: "GOAL_NOT_FOUND" };
    }

    if (existing.status !== GoalStatus.ACTIVE) {
      return {
        success: false,
        error: "GOAL_NOT_ACTIVE",
      };
    }

    if (existing.groupId) {
      const roleCheck = await assertGroupRole(
        session.user.id,
        existing.groupId,
        GroupRole.OWNER,
        GroupRole.ADMIN,
      );

      if (!roleCheck.success) {
        return { success: false, error: roleCheck.error };
      }
    } else if (existing.userId !== session.user.id) {
      return { success: false, error: "GOAL_NOT_OWNED" };
    }

    await prisma.goal.update({
      where: { id },
      data: {
        name,
        description,
        targetAmount,
        targetDate,
        ...(status ? { status } : {}),
      },
    });

    revalidatePath("/goals");
    if (existing.groupId) {
      revalidatePath(`/groups/${existing.groupId}/goals`);
    }
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GOAL_UPDATE_FAILED" };
  }
}
