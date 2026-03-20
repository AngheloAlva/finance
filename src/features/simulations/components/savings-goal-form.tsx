"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { simulateSavingsGoalAction } from "@/features/simulations/actions/simulate-savings-goal.action";
import { SavingsGoalResults } from "@/features/simulations/components/savings-goal-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type {
  GoalSnapshot,
  SavingsProjectionResult,
} from "@/features/simulations/types/simulations.types";
import { FieldError } from "@/shared/components/field-error";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface SavingsGoalFormProps {
  goals: GoalSnapshot[];
  currency: CurrencyCode;
}

const initialState: ActionResult<SavingsProjectionResult> = {
  success: false,
  error: "",
};

export function SavingsGoalForm({ goals, currency }: SavingsGoalFormProps) {
  const t = useTranslations("simulations.savingsGoal");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    simulateSavingsGoalAction,
    initialState,
  );

  if (goals.length === 0) {
    return (
      <SimulationEmptyState
        title={t("noActiveGoals")}
        description={t("noActiveGoalsDescription")}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalId">{t("selectGoal")}</Label>
            <NativeSelect
              className="w-full"
              id="goalId"
              name="goalId"
              required
              disabled={isPending}
            >
              <option value="">{t("chooseGoal")}</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </NativeSelect>
            {!state.success && <FieldError errors={state.fieldErrors?.goalId} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustedMonthlyContribution">
              {t("adjustedContribution")}
            </Label>
            <Input
              id="adjustedMonthlyContribution"
              name="adjustedMonthlyContribution"
              type="text"
              inputMode="decimal"
              placeholder={t("adjustedPlaceholder")}
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {t("projecting")}
              </>
            ) : (
              t("projectTimeline")
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{tErrors(state.error as Parameters<typeof tErrors>[0])}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <SavingsGoalResults result={state.data} currency={currency} />
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
