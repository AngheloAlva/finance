import { Card, CardContent } from "@/components/ui/card";
import type { MemberBalance } from "@/features/group-finances/types/group-finances.types";
import { CurrencyDisplay } from "@/shared/components/currency-display";
import type { CurrencyCode } from "@/shared/lib/constants";
import { cn } from "@/lib/utils";

interface GroupBalanceSummaryProps {
  balances: MemberBalance[];
  currency: CurrencyCode;
}

export function GroupBalanceSummary({
  balances,
  currency,
}: GroupBalanceSummaryProps) {
  if (balances.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No member balances to display.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {balances.map((balance) => (
        <Card
          key={balance.userId}
          className={cn(
            "relative",
            balance.netBalance > 0 && "border-emerald-500/30",
            balance.netBalance < 0 && "border-red-500/30",
          )}
        >
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {balance.userName ?? balance.userEmail}
            </p>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owed to them</span>
                <CurrencyDisplay
                  cents={balance.totalOwed}
                  currency={currency}
                  className="text-emerald-500"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">They owe</span>
                <CurrencyDisplay
                  cents={balance.totalOwes}
                  currency={currency}
                  className="text-red-500"
                />
              </div>
              <div className="mt-1 flex justify-between border-t pt-1">
                <span className="font-medium">Net balance</span>
                <CurrencyDisplay
                  cents={balance.netBalance}
                  currency={currency}
                  colorize
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
