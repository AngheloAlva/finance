"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import {
  assertGroupRole,
  canRemoveMember,
} from "@/features/groups/lib/groups.permissions";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function removeMemberAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const groupIdResult = requireFormId(formData, "groupId");
  if (!groupIdResult.success) return groupIdResult;
  const groupId = groupIdResult.data;

  const memberIdResult = requireFormId(formData, "memberId");
  if (!memberIdResult.success) return memberIdResult;
  const memberId = memberIdResult.data;

  const session = await requireSession();

  const permission = await assertGroupRole(session.user.id, groupId, GroupRole.OWNER, GroupRole.ADMIN);

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  try {
    const targetMember = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return { success: false, error: "MEMBER_NOT_FOUND" };
    }

    if (!canRemoveMember(permission.data.role, targetMember.role)) {
      return {
        success: false,
        error: "MEMBER_REMOVE_PERMISSION_DENIED",
      };
    }

    await prisma.groupMember.delete({ where: { id: memberId } });

    revalidatePath(`/groups/${groupId}`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "MEMBER_REMOVE_FAILED" };
  }
}
