"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { GroupRole, InvitationStatus } from "@/generated/prisma/enums";
import { inviteMemberSchema } from "@/features/groups/lib/groups.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function inviteMemberAction(
  _prevState: ActionResult<{ token: string }>,
  formData: FormData,
): Promise<ActionResult<{ token: string }>> {
  const raw = {
    groupId: formData.get("groupId"),
    email: formData.get("email"),
  };

  const result = inviteMemberSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { groupId, email } = result.data;

  const session = await requireSession();

  const permission = await assertGroupRole(session.user.id, groupId, GroupRole.OWNER, GroupRole.ADMIN);

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  try {
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId,
        user: { email },
      },
    });

    if (existingMember) {
      return { success: false, error: "GROUP_MEMBER_ALREADY_EXISTS" };
    }

    const pendingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        groupId,
        email,
        status: InvitationStatus.PENDING,
      },
    });

    if (pendingInvitation) {
      return { success: false, error: "INVITATION_ALREADY_PENDING" };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.groupInvitation.create({
      data: {
        email,
        token,
        expiresAt,
        groupId,
        invitedById: session.user.id,
      },
    });

    revalidatePath(`/groups/${groupId}`);

    return { success: true, data: { token } };
  } catch {
    return { success: false, error: "INVITATION_CREATE_FAILED" };
  }
}
