"use server";

import { revalidatePath } from "next/cache";

import { GoalStatus, GroupRole } from "@/generated/prisma/enums";
import { createGoalSchema } from "@/features/goals/lib/goals.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createGoalAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate") || undefined,
    groupId: formData.get("groupId") || undefined,
  };

  const result = createGoalSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, description, targetAmount, targetDate, groupId } = result.data;

  const session = await requireSession();

  try {
    if (groupId) {
      const roleCheck = await assertGroupRole(
        session.user.id,
        groupId,
        GroupRole.OWNER,
        GroupRole.ADMIN,
      );

      if (!roleCheck.success) {
        return { success: false, error: roleCheck.error };
      }
    }

    await prisma.goal.create({
      data: {
        name,
        description,
        targetAmount,
        targetDate,
        status: GoalStatus.ACTIVE,
        userId: session.user.id,
        groupId,
      },
    });

    revalidatePath("/goals");
    if (groupId) {
      revalidatePath(`/groups/${groupId}/goals`);
    }
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GOAL_CREATE_FAILED" };
  }
}
