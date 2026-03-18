import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteInvestmentButton } from "@/features/investments/components/delete-investment-button";
import { InvestmentDialog } from "@/features/investments/components/investment-dialog";
import { InvestmentValueForm } from "@/features/investments/components/investment-value-form";
import { ValueEvolutionChart } from "@/features/investments/components/value-evolution-chart";
import {
  INVESTMENT_TYPE_LABELS,
  buildChartData,
  calculateReturn,
  convertToBaseCurrency,
} from "@/features/investments/lib/investments.utils";
import type { InvestmentWithSnapshots } from "@/features/investments/types/investments.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatExchangeRate,
} from "@/shared/lib/formatters";
import { cn } from "@/lib/utils";

interface InvestmentDetailProps {
  investment: InvestmentWithSnapshots;
  userCurrency: CurrencyCode;
}

export function InvestmentDetail({ investment, userCurrency }: InvestmentDetailProps) {
  const currency = investment.currency as CurrencyCode;
  const returnData = calculateReturn(
    investment.initialAmount,
    investment.currentValue,
    investment.startDate,
    investment.totalFees,
  );
  const isPositive = returnData.percentageReturn >= 0;
  const chartData = buildChartData(investment.snapshots, investment.currentValue);

  const isForeignCurrency =
    investment.currency !== userCurrency &&
    investment.currentExchangeRate != null;

  const baseCurrentValue = isForeignCurrency
    ? convertToBaseCurrency(investment.currentValue, investment.currentExchangeRate)
    : null;
  const baseInitialAmount = isForeignCurrency
    ? convertToBaseCurrency(
        investment.initialAmount,
        investment.purchaseExchangeRate,
      )
    : null;
  const baseAbsoluteReturn =
    baseCurrentValue != null && baseInitialAmount != null
      ? baseCurrentValue - baseInitialAmount
      : null;

  const isStaleRate =
    isForeignCurrency &&
    investment.updatedAt != null &&
    Date.now() - new Date(investment.updatedAt).getTime() >
      7 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{investment.name}</h1>
        <div className="flex items-center gap-2">
          <InvestmentDialog
            mode="edit"
            investment={investment}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" data-icon="inline-start" />
                Edit
              </Button>
            }
          />
          <DeleteInvestmentButton
            investmentId={investment.id}
            investmentName={investment.name}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {formatCurrency(investment.currentValue, currency)}
            </p>
            {baseCurrentValue != null && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatCurrency(baseCurrentValue, userCurrency)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Initial Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {formatCurrency(investment.initialAmount, currency)}
            </p>
            {baseInitialAmount != null && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatCurrency(baseInitialAmount, userCurrency)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-sm font-semibold",
                isPositive ? "text-emerald-600" : "text-red-600",
              )}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(returnData.absoluteReturn, currency)} (
              {isPositive ? "+" : ""}
              {returnData.percentageReturn.toFixed(2)}%)
            </p>
            {baseAbsoluteReturn != null && (
              <p className="text-xs text-muted-foreground">
                ≈ {isPositive ? "+" : ""}
                {formatCurrency(baseAbsoluteReturn, userCurrency)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">
                {INVESTMENT_TYPE_LABELS[investment.type]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Institution</dt>
              <dd className="font-medium">{investment.institution}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Start Date</dt>
              <dd className="font-medium">
                {formatDate(investment.startDate, "short")}
              </dd>
            </div>
            {investment.maturityDate && (
              <div>
                <dt className="text-muted-foreground">Maturity Date</dt>
                <dd className="font-medium">
                  {formatDate(investment.maturityDate, "short")}
                </dd>
              </div>
            )}
            {investment.estimatedReturn != null && (
              <div>
                <dt className="text-muted-foreground">Estimated Return</dt>
                <dd className="font-medium">
                  {(investment.estimatedReturn / 100).toFixed(2)}% / year
                </dd>
              </div>
            )}
            {returnData.annualizedReturn != null && (
              <div>
                <dt className="text-muted-foreground">Annualized Return</dt>
                <dd
                  className={cn(
                    "font-medium",
                    returnData.annualizedReturn >= 0
                      ? "text-emerald-600"
                      : "text-red-600",
                  )}
                >
                  {returnData.annualizedReturn >= 0 ? "+" : ""}
                  {returnData.annualizedReturn.toFixed(2)}%
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {investment.isActive ? "Active" : "Inactive"}
              </dd>
            </div>
            {isForeignCurrency && investment.purchaseExchangeRate != null && (
              <div>
                <dt className="text-muted-foreground">Purchase Rate</dt>
                <dd className="font-medium">
                  1 {investment.currency} ={" "}
                  {formatExchangeRate(investment.purchaseExchangeRate)}{" "}
                  {userCurrency}
                </dd>
              </div>
            )}
            {isForeignCurrency &&
              investment.currentExchangeRate != null &&
              investment.currentExchangeRate !==
                investment.purchaseExchangeRate && (
                <div>
                  <dt className="text-muted-foreground">Current Rate</dt>
                  <dd className="font-medium">
                    1 {investment.currency} ={" "}
                    {formatExchangeRate(investment.currentExchangeRate)}{" "}
                    {userCurrency}
                  </dd>
                </div>
              )}
            {investment.totalFees != null && investment.totalFees > 0 && (
              <div>
                <dt className="text-muted-foreground">Broker Fees</dt>
                <dd className="font-medium">
                  {formatCurrency(investment.totalFees, currency)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Stale exchange rate warning */}
      {isStaleRate && (
        <div className="rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Exchange rate may be outdated. Last updated:{" "}
          {formatDate(investment.updatedAt, "short")}. Consider updating the
          current value.
        </div>
      )}

      {/* Update value */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Update Current Value</CardTitle>
        </CardHeader>
        <CardContent>
          <InvestmentValueForm
            investmentId={investment.id}
            currentValue={investment.currentValue}
            investmentCurrency={investment.currency}
            baseCurrency={userCurrency}
            currentExchangeRate={investment.currentExchangeRate}
          />
        </CardContent>
      </Card>

      {/* Value evolution chart */}
      <ValueEvolutionChart data={chartData} currency={currency} />
    </div>
  );
}
