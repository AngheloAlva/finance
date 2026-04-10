"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelect } from "@/features/categories/components/category-select";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { createRecurringAction } from "@/features/recurring/actions/create-recurring.action";
import { updateRecurringAction } from "@/features/recurring/actions/update-recurring.action";
import { FREQUENCY_KEYS, GENERATION_MODE_KEYS } from "@/features/recurring/types/recurring.types";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { FieldError } from "@/shared/components/field-error";
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types";

interface RecurringFormProps {
  mode: FormMode;
  defaultValues?: {
    id: string;
    amount: number;
    description: string;
    notes: string | null;
    type: string;
    paymentMethod: string;
    categoryId: string;
    frequency: string;
    interval: number;
    generationMode: string;
    startDate: string;
    endDate: string | null;
  };
  categories: CategoryWithChildren[];
  onSuccess?: () => void;
}

function formatDateForInput(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0] ?? "";
}

export function RecurringForm({
  mode,
  defaultValues,
  categories,
  onSuccess,
}: RecurringFormProps) {
  const t = useTranslations("recurring.form");
  const tt = useTranslations("recurring.types");
  const tp = useTranslations("recurring.paymentMethods");
  const tFreq = useTranslations("recurring.frequencies");
  const tMode = useTranslations("recurring.generationModes");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const action =
    mode === FORM_MODE.CREATE ? createRecurringAction : updateRecurringAction;
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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === FORM_MODE.EDIT && defaultValues && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {tErrors(state.error as Parameters<typeof tErrors>[0])}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-amount">{t("amount")}</Label>
        <AmountInput name="amount" defaultValue={defaultValues?.amount} />
        {!state.success && <FieldError errors={state.fieldErrors?.amount} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-description">{t("description")}</Label>
        <Input
          id="rec-description"
          name="description"
          type="text"
          defaultValue={defaultValues?.description}
          required
          placeholder={t("descriptionPlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.description} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-notes">{t("notes")}</Label>
        <Textarea
          id="rec-notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder={t("notesPlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.notes} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("type")}</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? "EXPENSE"} items={[{ value: "INCOME", label: tt("income") }, { value: "EXPENSE", label: tt("expense") }, { value: "TRANSFER", label: tt("transfer") }]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">{tt("income")}</SelectItem>
              <SelectItem value="EXPENSE">{tt("expense")}</SelectItem>
              <SelectItem value="TRANSFER">{tt("transfer")}</SelectItem>
            </SelectContent>
          </Select>
          {!state.success && <FieldError errors={state.fieldErrors?.type} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("paymentMethod")}</Label>
          <Select
            name="paymentMethod"
            defaultValue={defaultValues?.paymentMethod ?? "CASH"}
            items={[{ value: "CASH", label: tp("cash") }, { value: "DEBIT", label: tp("debit") }, { value: "CREDIT", label: tp("credit") }, { value: "TRANSFER", label: tp("transfer") }, { value: "OTHER", label: tp("other") }]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectMethod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">{tp("cash")}</SelectItem>
              <SelectItem value="DEBIT">{tp("debit")}</SelectItem>
              <SelectItem value="CREDIT">{tp("credit")}</SelectItem>
              <SelectItem value="TRANSFER">{tp("transfer")}</SelectItem>
              <SelectItem value="OTHER">{tp("other")}</SelectItem>
            </SelectContent>
          </Select>
          {!state.success && <FieldError errors={state.fieldErrors?.paymentMethod} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("frequency")}</Label>
          <Select
            name="frequency"
            defaultValue={defaultValues?.frequency ?? "MONTHLY"}
            items={Object.entries(FREQUENCY_KEYS).map(([value, key]) => ({ value, label: tFreq(key as Parameters<typeof tFreq>[0]) }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectFrequency")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_KEYS).map(([value, key]) => (
                <SelectItem key={value} value={value}>
                  {tFreq(key as Parameters<typeof tFreq>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!state.success && <FieldError errors={state.fieldErrors?.frequency} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-interval">{t("interval")}</Label>
          <Input
            id="rec-interval"
            name="interval"
            type="number"
            min={1}
            max={365}
            defaultValue={defaultValues?.interval ?? 1}
            required
          />
          {!state.success && <FieldError errors={state.fieldErrors?.interval} />}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("generationMode")}</Label>
        <Select
          name="generationMode"
          defaultValue={defaultValues?.generationMode ?? "AUTO"}
          items={Object.entries(GENERATION_MODE_KEYS).map(([value, key]) => ({ value, label: tMode(key as Parameters<typeof tMode>[0]) }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectGenerationMode")} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GENERATION_MODE_KEYS).map(([value, key]) => (
              <SelectItem key={value} value={value}>
                {tMode(key as Parameters<typeof tMode>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">{t("generationModeHint")}</p>
        {!state.success && <FieldError errors={state.fieldErrors?.generationMode} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("startDate")}</Label>
          <DatePicker
            name="startDate"
            defaultValue={
              defaultValues
                ? formatDateForInput(defaultValues.startDate)
                : undefined
            }
            required
            placeholder={t("selectStartDate")}
          />
          {!state.success && <FieldError errors={state.fieldErrors?.startDate} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("endDate")}</Label>
          <DatePicker
            name="endDate"
            defaultValue={
              defaultValues?.endDate
                ? formatDateForInput(defaultValues.endDate)
                : undefined
            }
            placeholder={t("selectEndDate")}
          />
          {!state.success && <FieldError errors={state.fieldErrors?.endDate} />}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("category")}</Label>
        <CategorySelect
          categories={categories}
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          error={
            !state.success ? state.fieldErrors?.categoryId?.[0] : undefined
          }
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? tc("saving")
          : mode === FORM_MODE.CREATE
            ? t("createRecurring")
            : t("updateRecurring")}
      </Button>
    </form>
  );
}
