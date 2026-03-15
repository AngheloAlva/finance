"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { simulateBudgetOptimizerAction } from "@/features/simulations/actions/simulate-budget-optimizer.action";
import { BudgetOptimizerResults } from "@/features/simulations/components/budget-optimizer-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type { BudgetOptimizerResult } from "@/features/simulations/types/simulations.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface BudgetOptimizerFormProps {
  currency: CurrencyCode;
}

const initialState: ActionResult<BudgetOptimizerResult> = {
  success: false,
  error: "",
};

export function BudgetOptimizerForm({ currency }: BudgetOptimizerFormProps) {
  const [state, formAction, isPending] = useActionState(
    simulateBudgetOptimizerAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={formAction}>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Analyzing...
            </>
          ) : (
            "Analyze Budget"
          )}
        </Button>

        {!state.success && state.error && (
          <p className="mt-2 text-xs text-destructive">{state.error}</p>
        )}
      </form>

      {state.success ? (
        <BudgetOptimizerResults result={state.data} currency={currency} />
      ) : (
        <SimulationEmptyState
          title="Budget Optimizer"
          description="Click 'Analyze Budget' to see your spending breakdown, identify avoidable expenses, and discover potential savings."
        />
      )}
    </div>
  );
}
