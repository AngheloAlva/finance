"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addContributionAction } from "@/features/goals/actions/add-contribution.action";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface ContributionFormProps {
  goalId: string;
  onSuccess?: () => void;
}

export function ContributionForm({ goalId, onSuccess }: ContributionFormProps) {
  const [state, formAction, isPending] = useActionState(
    addContributionAction,
    INITIAL_VOID_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Contribution added successfully");
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="goalId" value={goalId} />

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contrib-amount">Amount</Label>
          <AmountInput name="amount" />
          {!state.success && state.fieldErrors?.amount && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.amount[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <DatePicker
            name="date"
            defaultValue={today}
            required
            placeholder="Select date"
          />
          {!state.success && state.fieldErrors?.date && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.date[0]}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contrib-note">Note (optional)</Label>
        <Input
          id="contrib-note"
          name="note"
          type="text"
          placeholder="e.g. Monthly savings deposit"
        />
        {!state.success && state.fieldErrors?.note && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.note[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} size="sm" className="w-full">
        {isPending ? "Adding..." : "Add Contribution"}
      </Button>
    </form>
  );
}
