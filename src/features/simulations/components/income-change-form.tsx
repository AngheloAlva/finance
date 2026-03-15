"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { simulateIncomeChangeAction } from "@/features/simulations/actions/simulate-income-change.action";
import { IncomeChangeResults } from "@/features/simulations/components/income-change-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type { IncomeImpactResult } from "@/features/simulations/types/simulations.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface IncomeChangeFormProps {
  currency: CurrencyCode;
}

const initialState: ActionResult<IncomeImpactResult> = {
  success: false,
  error: "",
};

export function IncomeChangeForm({ currency }: IncomeChangeFormProps) {
  const [state, formAction, isPending] = useActionState(
    simulateIncomeChangeAction,
    initialState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="changePercent">
              Income Change (%)
            </Label>
            <Input
              id="changePercent"
              name="changePercent"
              type="number"
              min={-100}
              max={1000}
              step={1}
              placeholder="e.g. 20 for +20%, -30 for -30%"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Positive for increase, negative for decrease. Range: -100% to
              +1000%.
            </p>
            {!state.success && state.fieldErrors?.changePercent && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.changePercent[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Simulating...
              </>
            ) : (
              "Simulate Income Change"
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <IncomeChangeResults result={state.data} currency={currency} />
        ) : (
          <SimulationEmptyState
            title="Income Impact Simulator"
            description="Enter a percentage change to see how it affects your savings rate, goal timelines, and debt coverage."
          />
        )}
      </div>
    </div>
  );
}
