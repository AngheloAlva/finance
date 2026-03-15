"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { simulateAffordabilityAction } from "@/features/simulations/actions/simulate-affordability.action";
import { AffordabilityResults } from "@/features/simulations/components/affordability-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type {
  AffordabilityResult,
  CreditCardSnapshot,
} from "@/features/simulations/types/simulations.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface AffordabilityFormProps {
  creditCards: CreditCardSnapshot[];
  currency: CurrencyCode;
}

const initialState: ActionResult<AffordabilityResult> = {
  success: false,
  error: "",
};

export function AffordabilityForm({
  creditCards,
  currency,
}: AffordabilityFormProps) {
  const [state, formAction, isPending] = useActionState(
    simulateAffordabilityAction,
    initialState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="currencyCode" value={currency} />
          <div className="space-y-2">
            <Label htmlFor="purchaseAmount">Purchase Amount</Label>
            <Input
              id="purchaseAmount"
              name="purchaseAmount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              required
              disabled={isPending}
            />
            {!state.success && state.fieldErrors?.purchaseAmount && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.purchaseAmount[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="installments">Installments</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              max={48}
              defaultValue={1}
              disabled={isPending}
            />
          </div>

          {creditCards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="creditCardId">Credit Card (optional)</Label>
              <NativeSelect
                className="w-full"
                id="creditCardId"
                name="creditCardId"
                disabled={isPending}
              >
                <option value="">None (Cash/Debit)</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (*{card.lastFourDigits})
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Simulating...
              </>
            ) : (
              "Simulate Purchase"
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <AffordabilityResults result={state.data} currency={currency} />
        ) : (
          <SimulationEmptyState
            title="Affordability Simulator"
            description="Enter a purchase amount to see how it impacts your monthly budget and cash flow over the next 3 months."
          />
        )}
      </div>
    </div>
  );
}
