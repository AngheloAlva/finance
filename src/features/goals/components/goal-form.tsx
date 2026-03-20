"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGoalAction } from "@/features/goals/actions/create-goal.action";
import { updateGoalAction } from "@/features/goals/actions/update-goal.action";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { FieldError } from "@/shared/components/field-error";
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
  const t = useTranslations("goals.form");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const action =
    mode === FORM_MODE.CREATE ? createGoalAction : updateGoalAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? t("createdSuccess")
          : t("updatedSuccess");
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
          {tErrors(state.error as Parameters<typeof tErrors>[0])}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-name">{t("name")}</Label>
        <Input
          id="goal-name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          required
          placeholder={t("namePlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.name} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-description">{t("description")}</Label>
        <Textarea
          id="goal-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          rows={2}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.description} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-targetAmount">{t("targetAmount")}</Label>
        <AmountInput
          name="targetAmount"
          defaultValue={defaultValues?.targetAmount}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.targetAmount} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("targetDate")}</Label>
        <DatePicker
          name="targetDate"
          defaultValue={
            defaultValues?.targetDate
              ? new Date(defaultValues.targetDate).toISOString().split("T")[0]
              : undefined
          }
          placeholder={t("selectTargetDate")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.targetDate} />}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? tc("saving")
          : mode === FORM_MODE.CREATE
            ? t("createGoal")
            : t("updateGoal")}
      </Button>
    </form>
  );
}
