"use server";

import { revalidatePath } from "next/cache";

import { SplitRule } from "@/generated/prisma/enums";
import { createGroupTransactionSchema } from "@/features/group-finances/lib/group-finances.schema";
import { generateSplits } from "@/features/group-finances/lib/split.utils";
import type { CustomSplitInput, ProportionalSplitInput, SplitMember } from "@/features/group-finances/lib/split.utils";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import { getGroupMembers } from "@/features/groups/lib/groups.queries";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createGroupTransactionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
    groupId: formData.get("groupId"),
    splitRule: formData.get("splitRule"),
    splits: JSON.parse((formData.get("splits") as string) ?? "[]"),
  };

  const result = createGroupTransactionSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const {
    description,
    amount,
    type,
    categoryId,
    paymentMethod,
    notes,
    date,
    groupId,
    splitRule,
    splits: splitInputs,
  } = result.data;

  const session = await requireSession();

  try {
    // Verify the user is a group member
    const membership = await getGroupMembership(session.user.id, groupId);

    if (!membership) {
      return { success: false, error: "GROUP_NOT_MEMBER" };
    }

    // Fetch all active group members for split generation
    const groupMembers = await getGroupMembers(groupId);

    const members: SplitMember[] = groupMembers.map((m) => ({
      userId: m.userId,
      name: m.user.name ?? "",
    }));

    // Build proportional/custom inputs from the split form data
    let proportionalSplits: ProportionalSplitInput[] | undefined;
    let customSplits: CustomSplitInput[] | undefined;

    if (splitRule === SplitRule.PROPORTIONAL) {
      proportionalSplits = splitInputs.map((s) => ({
        userId: s.userId,
        percentage: s.percentage ?? 0,
      }));
    } else if (splitRule === SplitRule.CUSTOM) {
      customSplits = splitInputs.map((s) => ({
        userId: s.userId,
        amount: s.amount ?? 0,
      }));
    }

    const splitRows = generateSplits({
      totalAmount: amount,
      splitRule,
      members,
      proportionalSplits,
      customSplits,
    });

    // Create the transaction and splits atomically
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          description,
          notes: notes ?? null,
          date,
          impactDate: date,
          type,
          paymentMethod,
          categoryId,
          userId: session.user.id,
          groupId,
          splitRule,
          isTemplate: false,
        },
      });

      await tx.transactionSplit.createMany({
        data: splitRows.map((row) => ({
          transactionId: transaction.id,
          userId: row.userId,
          amount: row.amount,
          isPaid: row.userId === session.user.id,
          paidAt: row.userId === session.user.id ? new Date() : null,
        })),
      });
    });

    revalidatePath(`/groups/${groupId}/transactions`);
    revalidatePath(`/groups/${groupId}/dashboard`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GROUP_TRANSACTION_CREATE_FAILED" };
  }
}
