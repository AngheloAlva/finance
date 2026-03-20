"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { simulateIncomeChangeAction } from "@/features/simulations/actions/simulate-income-change.action";
import { IncomeChangeResults } from "@/features/simulations/components/income-change-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type { IncomeImpactResult } from "@/features/simulations/types/simulations.types";
import { FieldError } from "@/shared/components/field-error";
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
  const t = useTranslations("simulations.incomeChange");
  const tErrors = useTranslations("errors");
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
              {t("changePercent")}
            </Label>
            <Input
              id="changePercent"
              name="changePercent"
              type="number"
              min={-100}
              max={1000}
              step={1}
              placeholder={t("changePlaceholder")}
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t("changeHelp")}
            </p>
            {!state.success && <FieldError errors={state.fieldErrors?.changePercent} />}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {t("simulating")}
              </>
            ) : (
              t("simulate")
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{tErrors(state.error as Parameters<typeof tErrors>[0])}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <IncomeChangeResults result={state.data} currency={currency} />
        ) : (
          <SimulationEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        )}
      </div>
    </div>
  );
}
