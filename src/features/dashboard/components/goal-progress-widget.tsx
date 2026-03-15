import { Target } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoalProgress } from "@/features/goals/components/goal-progress";
import type { GoalWithProgress } from "@/features/goals/types/goals.types";
import type { CurrencyCode } from "@/shared/lib/constants";

interface GoalProgressWidgetProps {
  goals: GoalWithProgress[];
  currency: CurrencyCode;
}

export function GoalProgressWidget({
  goals,
  currency,
}: GoalProgressWidgetProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Target className="size-4" />
            Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No active goals.{" "}
            <Link href="/goals" className="underline hover:text-foreground">
              Create one
            </Link>{" "}
            to start tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Target className="size-4" />
          Active Goals
        </CardTitle>
        <Link
          href="/goals"
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="flex flex-col gap-1">
            <span className="text-xs font-medium">{goal.name}</span>
            <GoalProgress
              currentAmount={goal.currentAmount}
              targetAmount={goal.targetAmount}
              percentage={goal.percentage}
              currency={currency}
              compact
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
