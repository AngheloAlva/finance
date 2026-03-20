"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteGoalAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });

    if (!goal) {
      return { success: false, error: "GOAL_NOT_FOUND" };
    }

    if (goal.groupId) {
      const roleCheck = await assertGroupRole(
        session.user.id,
        goal.groupId,
        GroupRole.OWNER,
        GroupRole.ADMIN,
      );

      if (!roleCheck.success) {
        return { success: false, error: roleCheck.error };
      }
    } else if (goal.userId !== session.user.id) {
      return { success: false, error: "GOAL_NOT_OWNED" };
    }

    await prisma.goal.delete({ where: { id } });

    revalidatePath("/goals");
    if (goal.groupId) {
      revalidatePath(`/groups/${goal.groupId}/goals`);
    }
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GOAL_DELETE_FAILED" };
  }
}
