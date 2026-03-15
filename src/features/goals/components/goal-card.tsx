"use client";

import { useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { GoalProgress } from "@/features/goals/components/goal-progress";
import { GoalDialog } from "@/features/goals/components/goal-dialog";
import { ContributionForm } from "@/features/goals/components/contribution-form";
import { ContributionList } from "@/features/goals/components/contribution-list";
import { DeleteGoalButton } from "@/features/goals/components/delete-goal-button";
import { GoalStatus } from "@/generated/prisma/enums";
import type { GoalDetail, GoalWithProgress } from "@/features/goals/types/goals.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import { formatDate } from "@/shared/lib/formatters";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

interface GoalCardProps {
  goal: GoalWithProgress;
  currency: CurrencyCode;
  isOwner: boolean;
  detail?: GoalDetail | null;
  showUser?: boolean;
}

export function GoalCard({
  goal,
  currency,
  isOwner,
  detail,
  showUser = false,
}: GoalCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-medium">{goal.name}</CardTitle>
            {goal.targetDate && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="size-3" />
                <span>{formatDate(goal.targetDate, "short")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={STATUS_VARIANT[goal.status] ?? "outline"}>
              {goal.status.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <GoalProgress
            currentAmount={goal.currentAmount}
            targetAmount={goal.targetAmount}
            percentage={goal.percentage}
            currency={currency}
          />
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">{goal.name}</DialogTitle>
              <div className="flex items-center gap-1">
                {isOwner && goal.status === GoalStatus.ACTIVE && (
                  <GoalDialog
                    mode="edit"
                    goal={goal}
                    trigger={
                      <Button variant="ghost" size="icon-xs">
                        <Pencil className="size-3" />
                      </Button>
                    }
                  />
                )}
                {isOwner && (
                  <DeleteGoalButton goalId={goal.id} goalName={goal.name} />
                )}
              </div>
            </div>
            {goal.description && (
              <DialogDescription>{goal.description}</DialogDescription>
            )}
            {!goal.description && <DialogDescription />}
          </DialogHeader>

          <GoalProgress
            currentAmount={goal.currentAmount}
            targetAmount={goal.targetAmount}
            percentage={goal.percentage}
            currency={currency}
          />

          {goal.status === GoalStatus.ACTIVE && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-medium">Add Contribution</h4>
                <ContributionForm goalId={goal.id} />
              </div>
            </>
          )}

          {detail && detail.contributions.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-medium">
                  Contributions ({detail.contributionCount})
                </h4>
                <div className="max-h-48 overflow-y-auto">
                  <ContributionList
                    contributions={detail.contributions}
                    currency={currency}
                    showUser={showUser}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
