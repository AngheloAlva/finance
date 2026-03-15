"use client";

import { useActionState } from "react";

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
  const [state, formAction, isPending] = useActionState(
    simulateSavingsGoalAction,
    initialState,
  );

  if (goals.length === 0) {
    return (
      <SimulationEmptyState
        title="No Active Goals"
        description="Create a savings goal first, then come back to project your timeline."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalId">Select Goal</Label>
            <NativeSelect
              className="w-full"
              id="goalId"
              name="goalId"
              required
              disabled={isPending}
            >
              <option value="">Choose a goal...</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </NativeSelect>
            {!state.success && state.fieldErrors?.goalId && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.goalId[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustedMonthlyContribution">
              Adjusted Monthly Contribution (optional)
            </Label>
            <Input
              id="adjustedMonthlyContribution"
              name="adjustedMonthlyContribution"
              type="text"
              inputMode="decimal"
              placeholder="Leave empty to use current savings rate"
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Projecting...
              </>
            ) : (
              "Project Timeline"
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <SavingsGoalResults result={state.data} currency={currency} />
        ) : (
          <SimulationEmptyState
            title="Savings Goal Projector"
            description="Select a goal and optionally adjust your monthly contribution to see when you will reach your target."
          />
        )}
      </div>
    </div>
  );
}
