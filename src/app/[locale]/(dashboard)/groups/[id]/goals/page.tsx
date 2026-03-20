import { GroupRole } from "@/generated/prisma/enums";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { GoalDialog } from "@/features/goals/components/goal-dialog";
import { GoalList } from "@/features/goals/components/goal-list";
import { getGroupGoals, getGoalById } from "@/features/goals/lib/goals.queries";
import type { GoalDetail } from "@/features/goals/types/goals.types";
import {
  assertGroupRole,
  canManageGoals,
} from "@/features/groups/lib/groups.permissions";
import type { CurrencyCode } from "@/shared/lib/constants";
import { requireSession } from "@/shared/lib/auth";
import { notFound } from "next/navigation";

interface GroupGoalsPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupGoalsPage({
  params,
}: GroupGoalsPageProps) {
  const session = await requireSession();
  const { id: groupId } = await params;

  const roleCheck = await assertGroupRole(
    session.user.id,
    groupId,
    GroupRole.OWNER,
    GroupRole.ADMIN,
    GroupRole.MEMBER,
  );

  if (!roleCheck.success) {
    notFound();
  }

  const currency = (session.user.currency ?? "USD") as CurrencyCode;
  const goals = await getGroupGoals(groupId);

  const goalDetails = new Map<string, GoalDetail>();
  const details = await Promise.all(
    goals.map((g) => getGoalById(g.id, session.user.id)),
  );
  for (const detail of details) {
    if (detail) goalDetails.set(detail.id, detail);
  }

  const showCreate = canManageGoals(roleCheck.data.role);

  const t = await getTranslations("groups.goals");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        {showCreate && (
          <GoalDialog
            mode="create"
            groupId={groupId}
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                {t("newGoal")}
              </Button>
            }
          />
        )}
      </div>

      <GoalList
        goals={goals}
        goalDetails={goalDetails}
        currency={currency}
        userId={session.user.id}
        showUser
      />
    </div>
  );
}
