import {
  ArrowLeftRight,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";

import type { GroupOverview } from "@/features/group-finances/types/group-finances.types";
import { StatCard } from "@/features/dashboard/components/stat-card";
import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/lib/utils";

interface GroupOverviewCardsProps {
  overview: GroupOverview;
  currency: CurrencyCode;
}

export function GroupOverviewCards({
  overview,
  currency,
}: GroupOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Expenses"
        value={formatCurrency(overview.totalExpenses, currency)}
        icon={TrendingDown}
        className={cn(
          "[&_[data-slot=card-content]_.size-10]:bg-red-500/10",
          "[&_[data-slot=card-content]_.size-5]:text-red-500",
        )}
      />
      <StatCard
        title="Transactions"
        value={overview.totalTransactions.toString()}
        icon={ArrowLeftRight}
      />
      <StatCard
        title="Unsettled"
        value={formatCurrency(overview.totalUnsettled, currency)}
        icon={Wallet}
        className={cn(
          overview.totalUnsettled > 0
            ? "[&_[data-slot=card-content]_.size-5]:text-amber-500"
            : "[&_[data-slot=card-content]_.size-5]:text-emerald-500",
        )}
      />
      <StatCard
        title="Members"
        value={overview.memberCount.toString()}
        icon={Users}
      />
    </div>
  );
}
