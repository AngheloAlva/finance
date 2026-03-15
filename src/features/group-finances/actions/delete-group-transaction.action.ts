"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteGroupTransactionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { id: true, groupId: true, userId: true },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (!transaction.groupId) {
      return { success: false, error: "This is not a group transaction" };
    }

    // Verify the user is a member of the group
    const membership = await getGroupMembership(
      session.user.id,
      transaction.groupId,
    );

    if (!membership) {
      return { success: false, error: "You are not a member of this group" };
    }

    // Only the payer or an admin/owner can delete
    if (
      transaction.userId !== session.user.id &&
      membership.role === GroupRole.MEMBER
    ) {
      return {
        success: false,
        error: "Only the payer or a group admin can delete this transaction",
      };
    }

    // Cascade deletes splits automatically (onDelete: Cascade on schema)
    await prisma.transaction.delete({ where: { id } });

    revalidatePath(`/groups/${transaction.groupId}/transactions`);
    revalidatePath(`/groups/${transaction.groupId}/dashboard`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete group transaction" };
  }
}
