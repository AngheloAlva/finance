"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGoalAction } from "@/features/goals/actions/create-goal.action";
import { updateGoalAction } from "@/features/goals/actions/update-goal.action";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types";

interface GoalFormProps {
  mode: FormMode;
  defaultValues?: {
    id: string;
    name: string;
    description?: string | null;
    targetAmount: number;
    targetDate?: string | null;
    groupId?: string | null;
  };
  groupId?: string;
  onSuccess?: () => void;
}

export function GoalForm({
  mode,
  defaultValues,
  groupId,
  onSuccess,
}: GoalFormProps) {
  const action =
    mode === FORM_MODE.CREATE ? createGoalAction : updateGoalAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? "Goal created successfully"
          : "Goal updated successfully";
      toast.success(message);
      onSuccess?.();
    }
  }, [state, mode, onSuccess]);

  const effectiveGroupId = groupId ?? defaultValues?.groupId;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === FORM_MODE.EDIT && defaultValues && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {effectiveGroupId && (
        <input type="hidden" name="groupId" value={effectiveGroupId} />
      )}

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-name">Name</Label>
        <Input
          id="goal-name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          required
          placeholder="e.g. Emergency Fund"
        />
        {!state.success && state.fieldErrors?.name && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-description">Description (optional)</Label>
        <Textarea
          id="goal-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="What is this goal for?"
          rows={2}
        />
        {!state.success && state.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-targetAmount">Target Amount</Label>
        <AmountInput
          name="targetAmount"
          defaultValue={defaultValues?.targetAmount}
        />
        {!state.success && state.fieldErrors?.targetAmount && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.targetAmount[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Target Date (optional)</Label>
        <DatePicker
          name="targetDate"
          defaultValue={
            defaultValues?.targetDate
              ? new Date(defaultValues.targetDate).toISOString().split("T")[0]
              : undefined
          }
          placeholder="Select target date"
        />
        {!state.success && state.fieldErrors?.targetDate && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.targetDate[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? "Saving..."
          : mode === FORM_MODE.CREATE
            ? "Create Goal"
            : "Update Goal"}
      </Button>
    </form>
  );
}
