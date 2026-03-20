import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { GoalDialog } from "@/features/goals/components/goal-dialog";
import { GoalList } from "@/features/goals/components/goal-list";
import { getUserGoals, getGoalById } from "@/features/goals/lib/goals.queries";
import type { GoalDetail } from "@/features/goals/types/goals.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import { requireSession } from "@/shared/lib/auth";

export default async function GoalsPage() {
  const t = await getTranslations("goals");
  const session = await requireSession();
  const currency = (session.user.currency ?? "USD") as CurrencyCode;
  const goals = await getUserGoals(session.user.id);

  const goalDetails = new Map<string, GoalDetail>();
  const details = await Promise.all(
    goals.map((g) => getGoalById(g.id, session.user.id)),
  );
  for (const detail of details) {
    if (detail) goalDetails.set(detail.id, detail);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <GoalDialog
          mode="create"
          trigger={
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              {t("newGoal")}
            </Button>
          }
        />
      </div>

      <GoalList
        goals={goals}
        goalDetails={goalDetails}
        currency={currency}
        userId={session.user.id}
      />
    </div>
  );
}
