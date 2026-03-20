"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("simulations.budgetOptimizer");
  const tErrors = useTranslations("errors");
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
              {t("analyzing")}
            </>
          ) : (
            t("analyzeBudget")
          )}
        </Button>

        {!state.success && state.error && (
          <p className="mt-2 text-xs text-destructive">{tErrors(state.error as Parameters<typeof tErrors>[0])}</p>
        )}
      </form>

      {state.success ? (
        <BudgetOptimizerResults result={state.data} currency={currency} />
      ) : (
        <SimulationEmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
    </div>
  );
}
