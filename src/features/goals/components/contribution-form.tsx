"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addContributionAction } from "@/features/goals/actions/add-contribution.action";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { FieldError } from "@/shared/components/field-error";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface ContributionFormProps {
  goalId: string;
  onSuccess?: () => void;
}

export function ContributionForm({ goalId, onSuccess }: ContributionFormProps) {
  const t = useTranslations("goals.contribution");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    addContributionAction,
    INITIAL_VOID_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(t("addedSuccess"));
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
          {tErrors(state.error as Parameters<typeof tErrors>[0])}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contrib-amount">{t("amount")}</Label>
          <AmountInput name="amount" />
          {!state.success && <FieldError errors={state.fieldErrors?.amount} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("date")}</Label>
          <DatePicker
            name="date"
            defaultValue={today}
            required
            placeholder={t("selectDate")}
          />
          {!state.success && <FieldError errors={state.fieldErrors?.date} />}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contrib-note">{t("note")}</Label>
        <Input
          id="contrib-note"
          name="note"
          type="text"
          placeholder={t("notePlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.note} />}
      </div>

      <Button type="submit" disabled={isPending} size="sm" className="w-full">
        {isPending ? t("adding") : t("addContribution")}
      </Button>
    </form>
  );
}
