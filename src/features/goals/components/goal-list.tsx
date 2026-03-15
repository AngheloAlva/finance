"use client";

import { useMemo, useState } from "react";
import { Target } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalCard } from "@/features/goals/components/goal-card";
import type { GoalDetail, GoalWithProgress } from "@/features/goals/types/goals.types";
import type { CurrencyCode } from "@/shared/lib/constants";

const STATUS_TABS = ["all", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const TAB_LABELS: Record<StatusTab, string> = {
  all: "All",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface GoalListProps {
  goals: GoalWithProgress[];
  goalDetails: Map<string, GoalDetail>;
  currency: CurrencyCode;
  userId: string;
  showUser?: boolean;
}

export function GoalList({
  goals,
  goalDetails,
  currency,
  userId,
  showUser = false,
}: GoalListProps) {
  const [tab, setTab] = useState<StatusTab>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return goals;
    return goals.filter((g) => g.status === tab);
  }, [goals, tab]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
      <TabsList>
        {STATUS_TABS.map((t) => (
          <TabsTrigger key={t} value={t}>
            {TAB_LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={tab} className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Target className="size-8" />
            <p className="text-sm">
              {tab === "all"
                ? "No goals yet. Create your first goal to get started."
                : `No ${TAB_LABELS[tab].toLowerCase()} goals.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currency={currency}
                isOwner={goal.userId === userId}
                detail={goalDetails.get(goal.id) ?? null}
                showUser={showUser}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
