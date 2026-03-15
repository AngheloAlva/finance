"use server";

import { revalidatePath } from "next/cache";

import { GoalStatus, GroupRole } from "@/generated/prisma/enums";
import { addContributionSchema } from "@/features/goals/lib/goals.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { generateAlertsForContribution } from "@/features/alerts/lib/alert-generation";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function addContributionAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  };

  const result = addContributionSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { goalId, amount, date, note } = result.data;

  const session = await requireSession();

  try {
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal) {
      return { success: false, error: "Goal not found" };
    }

    if (goal.status !== GoalStatus.ACTIVE) {
      return {
        success: false,
        error: "Contributions can only be added to active goals",
      };
    }

    if (goal.groupId) {
      const roleCheck = await assertGroupRole(
        session.user.id,
        goal.groupId,
        GroupRole.OWNER,
        GroupRole.ADMIN,
        GroupRole.MEMBER,
      );

      if (!roleCheck.success) {
        return { success: false, error: roleCheck.error };
      }
    } else if (goal.userId !== session.user.id) {
      return {
        success: false,
        error: "You can only contribute to your own goals",
      };
    }

    const [, aggregation] = await prisma.$transaction([
      prisma.goalContribution.create({
        data: {
          amount,
          date,
          note,
          goalId,
          userId: session.user.id,
        },
      }),
      prisma.goalContribution.aggregate({
        where: { goalId },
        _sum: { amount: true },
      }),
    ]);

    const totalContributed = aggregation._sum.amount ?? 0;

    if (totalContributed >= goal.targetAmount) {
      await prisma.goal.update({
        where: { id: goalId },
        data: { status: GoalStatus.COMPLETED },
      });
    }

    // Fire-and-forget: check goal alerts
    try {
      await generateAlertsForContribution(goalId, session.user.id);
    } catch {
      // Never block contribution flow
    }

    revalidatePath("/goals");
    if (goal.groupId) {
      revalidatePath(`/groups/${goal.groupId}/goals`);
    }
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to add contribution" };
  }
}
