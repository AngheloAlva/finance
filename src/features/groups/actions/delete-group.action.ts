"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteGroupAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  const permission = await assertGroupRole(session.user.id, id, GroupRole.OWNER);

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  try {
    const memberCount = await prisma.groupMember.count({
      where: { groupId: id },
    });

    if (memberCount > 1) {
      return {
        success: false,
        error: "GROUP_DELETE_HAS_MEMBERS",
      };
    }

    await prisma.group.delete({ where: { id } });

    revalidatePath("/groups");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GROUP_DELETE_FAILED" };
  }
}
