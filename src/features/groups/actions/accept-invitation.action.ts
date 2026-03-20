"use server";

import { redirect } from "next/navigation";

import { GroupRole, InvitationStatus } from "@/generated/prisma/enums";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function acceptInvitationAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const token = formData.get("token");

  if (typeof token !== "string" || token.length === 0) {
    return { success: false, error: "FIELD_REQUIRED" };
  }

  const session = await requireSession();

  try {
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return { success: false, error: "INVITATION_NOT_FOUND" };
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return { success: false, error: "INVITATION_ALREADY_USED" };
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: "INVITATION_EXPIRED" };
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: invitation.groupId,
        },
      },
    });

    if (existingMember) {
      return { success: false, error: "GROUP_MEMBER_ALREADY_EXISTS" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      await tx.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: invitation.groupId,
          role: GroupRole.MEMBER,
        },
      });
    });

    redirect(`/groups/${invitation.groupId}`);
  } catch (error) {
    if (error instanceof Error && "digest" in error) {
      throw error;
    }
    return { success: false, error: "INVITATION_ACCEPT_FAILED" };
  }
}
