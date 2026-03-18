"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInvestmentValueAction } from "@/features/investments/actions/update-investment-value.action";
import {
  displayToRate,
  rateToDisplay,
} from "@/features/investments/lib/investments.utils";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface InvestmentValueFormProps {
  investmentId: string;
  currentValue: number;
  investmentCurrency?: string;
  baseCurrency?: string;
  currentExchangeRate?: number | null;
}

export function InvestmentValueForm({
  investmentId,
  currentValue,
  investmentCurrency,
  baseCurrency,
  currentExchangeRate,
}: InvestmentValueFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateInvestmentValueAction,
    INITIAL_VOID_STATE,
  );

  const isForeignCurrency =
    investmentCurrency != null &&
    baseCurrency != null &&
    investmentCurrency !== baseCurrency;

  const [exchangeRateDisplay, setExchangeRateDisplay] = useState(() => {
    if (currentExchangeRate) {
      return rateToDisplay(currentExchangeRate).toString();
    }
    return "";
  });

  const handleExchangeRateBlur = useCallback(() => {
    const cleaned = exchangeRateDisplay.replace(/[^0-9.-]/g, "");
    const value = parseFloat(cleaned);
    if (!Number.isNaN(value) && value > 0) {
      setExchangeRateDisplay(value.toFixed(4));
    }
  }, [exchangeRateDisplay]);

  const exchangeRateStored = (() => {
    const cleaned = exchangeRateDisplay.replace(/[^0-9.-]/g, "");
    const value = parseFloat(cleaned);
    if (!Number.isNaN(value) && value > 0) {
      return displayToRate(value);
    }
    return "";
  })();

  useEffect(() => {
    if (state.success) {
      toast.success("Investment value updated");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={investmentId} />
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <AmountInput name="currentValue" defaultValue={currentValue} />
          {!state.success && state.fieldErrors?.currentValue && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.currentValue[0]}
            </p>
          )}
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Updating..." : "Update Value"}
        </Button>
      </div>
      {isForeignCurrency && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-value-exchangeRate">
            Exchange Rate (1 {investmentCurrency} = ? {baseCurrency})
          </Label>
          <input
            type="hidden"
            name="currentExchangeRate"
            value={exchangeRateStored}
          />
          <Input
            id="inv-value-exchangeRate"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 950.2500"
            value={exchangeRateDisplay}
            onChange={(e) => setExchangeRateDisplay(e.target.value)}
            onBlur={handleExchangeRateBlur}
          />
          {!state.success && state.fieldErrors?.currentExchangeRate && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.currentExchangeRate[0]}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
