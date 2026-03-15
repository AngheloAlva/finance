"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { changeRoleSchema } from "@/features/groups/lib/groups.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function changeRoleAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    groupId: formData.get("groupId"),
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  };

  const result = changeRoleSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { groupId, memberId, role } = result.data;

  const session = await requireSession();

  const permission = await assertGroupRole(session.user.id, groupId, GroupRole.OWNER);

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  try {
    const targetMember = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    if (targetMember.role === GroupRole.OWNER) {
      return { success: false, error: "Cannot change the role of the group owner" };
    }

    await prisma.groupMember.update({
      where: { id: memberId },
      data: { role },
    });

    revalidatePath(`/groups/${groupId}`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to change member role" };
  }
}
