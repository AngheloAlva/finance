"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateInvestmentValueAction } from "@/features/investments/actions/update-investment-value.action";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface InvestmentValueFormProps {
  investmentId: string;
  currentValue: number;
}

export function InvestmentValueForm({
  investmentId,
  currentValue,
}: InvestmentValueFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateInvestmentValueAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Investment value updated");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="id" value={investmentId} />
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
    </form>
  );
}
