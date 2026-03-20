"use server";

import { revalidatePath } from "next/cache";

import { settleSplitSchema } from "@/features/group-finances/lib/group-finances.schema";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function settleSplitAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = { splitId: formData.get("splitId") };

  const result = settleSplitSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: "FIELD_REQUIRED" };
  }

  const { splitId } = result.data;

  const session = await requireSession();

  try {
    const split = await prisma.transactionSplit.findUnique({
      where: { id: splitId },
      include: {
        transaction: {
          select: { groupId: true },
        },
      },
    });

    if (!split) {
      return { success: false, error: "SPLIT_NOT_FOUND" };
    }

    if (!split.transaction.groupId) {
      return { success: false, error: "SPLIT_NOT_GROUP" };
    }

    // Verify user is a member of the group
    const membership = await getGroupMembership(
      session.user.id,
      split.transaction.groupId,
    );

    if (!membership) {
      return { success: false, error: "GROUP_NOT_MEMBER" };
    }

    // Toggle isPaid status
    await prisma.transactionSplit.update({
      where: { id: splitId },
      data: {
        isPaid: !split.isPaid,
        paidAt: split.isPaid ? null : new Date(),
      },
    });

    revalidatePath(`/groups/${split.transaction.groupId}/transactions`);
    revalidatePath(`/groups/${split.transaction.groupId}/dashboard`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "SPLIT_SETTLE_FAILED" };
  }
}
