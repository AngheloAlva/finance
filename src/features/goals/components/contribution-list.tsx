import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import type { GoalContributionItem } from "@/features/goals/types/goals.types";

interface ContributionListProps {
  contributions: GoalContributionItem[];
  currency: CurrencyCode;
  showUser?: boolean;
}

export function ContributionList({
  contributions,
  currency,
  showUser = false,
}: ContributionListProps) {
  if (contributions.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No contributions yet
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {contributions.map((contribution) => (
        <div
          key={contribution.id}
          className="flex items-center justify-between py-2"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium">
                {formatCurrency(contribution.amount, currency)}
              </span>
              {showUser && (
                <span className="text-muted-foreground">
                  by {contribution.user.name}
                </span>
              )}
            </div>
            {contribution.note && (
              <p className="text-[10px] text-muted-foreground">
                {contribution.note}
              </p>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {formatDate(contribution.date, "short")}
          </span>
        </div>
      ))}
    </div>
  );
}
