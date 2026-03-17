import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardDialog } from "@/features/credit-cards/components/credit-card-dialog";
import { CreditCardVisual } from "@/features/credit-cards/components/credit-card-visual";
import { DeleteCreditCardButton } from "@/features/credit-cards/components/delete-credit-card-button";
import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils";
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types";
import type { CreditCardWithUsage } from "@/features/credit-cards/types/credit-cards.types";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import type { CurrencyCode } from "@/shared/lib/constants";

interface CreditCardDetailProps {
  card: CreditCardWithUsage;
  transactions: TransactionWithCategory[];
  cycleStart: Date;
  cycleEnd: Date;
  currency: CurrencyCode;
}

export function CreditCardDetail({
  card,
  transactions,
  cycleStart,
  cycleEnd,
  currency,
}: CreditCardDetailProps) {
  const today = new Date();
  const statementDates = computeStatementDates(
    card.closingDay,
    card.paymentDay,
    today,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{card.name}</h1>
        <div className="flex items-center gap-2">
          <CreditCardDialog
            mode="edit"
            creditCard={card}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" data-icon="inline-start" />
                Edit
              </Button>
            }
          />
          <DeleteCreditCardButton
            creditCardId={card.id}
            creditCardName={card.name}
          />
        </div>
      </div>

      {/* Card visual */}
      <div className="mx-auto w-full max-w-sm">
        <CreditCardVisual
          name={card.name}
          brand={card.brand}
          lastFourDigits={card.lastFourDigits}
          color={card.color}
          totalLimit={card.totalLimit}
          usedLimit={card.usedLimit}
          currency={currency}
        />
      </div>

      {/* Cycle info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Closing Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {formatDate(statementDates.cycleEnd, "short")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Payment Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {formatDate(statementDates.paymentDueDate, "short")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Available Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {formatCurrency(card.availableLimit, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions in current cycle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Current Cycle Transactions ({formatDate(cycleStart, "short")} -{" "}
            {formatDate(cycleEnd, "short")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions in the current billing cycle.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {tx.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tx.date, "short")} - {tx.category.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
