import {
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/lib/utils";

import type { MonthlyOverview } from "@/features/dashboard/types/dashboard.types";
import { StatCard } from "./stat-card";

interface OverviewCardsProps {
  overview: MonthlyOverview;
  currency: CurrencyCode;
}

export function OverviewCards({ overview, currency }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Income"
        value={formatCurrency(overview.totalIncome, currency)}
        icon={TrendingUp}
        className={cn(
          "[&_[data-slot=card-content]_.size-10]:bg-emerald-500/10",
          "[&_[data-slot=card-content]_.size-5]:text-emerald-500",
        )}
      />
      <StatCard
        title="Expenses"
        value={formatCurrency(overview.totalExpenses, currency)}
        icon={TrendingDown}
        className={cn(
          "[&_[data-slot=card-content]_.size-10]:bg-red-500/10",
          "[&_[data-slot=card-content]_.size-5]:text-red-500",
        )}
      />
      <StatCard
        title="Balance"
        value={formatCurrency(overview.balance, currency)}
        icon={Wallet}
        className={cn(
          overview.balance >= 0
            ? "[&_[data-slot=card-content]_.size-5]:text-emerald-500"
            : "[&_[data-slot=card-content]_.size-5]:text-red-500",
        )}
      />
      <StatCard
        title="Transactions"
        value={overview.transactionCount.toString()}
        icon={ArrowLeftRight}
      />
    </div>
  );
}
