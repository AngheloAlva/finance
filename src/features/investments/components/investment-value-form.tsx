"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { FieldError } from "@/shared/components/field-error";
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
  const t = useTranslations("investments.valueForm");
  const tf = useTranslations("investments.form");
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
      toast.success(t("updatedSuccess"));
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={investmentId} />
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <AmountInput name="currentValue" defaultValue={currentValue} />
          {!state.success && <FieldError errors={state.fieldErrors?.currentValue} />}
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("updating") : t("updateValue")}
        </Button>
      </div>
      {isForeignCurrency && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-value-exchangeRate">
            {tf("exchangeRate", { from: investmentCurrency, to: baseCurrency })}
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
            placeholder={tf("exchangeRatePlaceholder")}
            value={exchangeRateDisplay}
            onChange={(e) => setExchangeRateDisplay(e.target.value)}
            onBlur={handleExchangeRateBlur}
          />
          {!state.success && <FieldError errors={state.fieldErrors?.currentExchangeRate} />}
        </div>
      )}
    </form>
  );
}
