"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { simulateDebtPayoffAction } from "@/features/simulations/actions/simulate-debt-payoff.action";
import { DebtPayoffResults } from "@/features/simulations/components/debt-payoff-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type { DebtPayoffResult } from "@/features/simulations/types/simulations.types";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface DebtPayoffFormProps {
  currency: CurrencyCode;
}

const initialState: ActionResult<DebtPayoffResult> = {
  success: false,
  error: "",
};

export function DebtPayoffForm({ currency }: DebtPayoffFormProps) {
  const t = useTranslations("simulations.debtPayoff");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    simulateDebtPayoffAction,
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
            t("analyzeDebt")
          )}
        </Button>

        {!state.success && state.error && (
          <p className="mt-2 text-xs text-destructive">{tErrors(state.error as Parameters<typeof tErrors>[0])}</p>
        )}
      </form>

      {state.success ? (
        <DebtPayoffResults result={state.data} currency={currency} />
      ) : (
        <SimulationEmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
    </div>
  );
}
