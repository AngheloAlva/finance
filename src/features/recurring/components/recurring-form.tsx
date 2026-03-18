"use client";

import { useActionState, useEffect } from "react";
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
import { FREQUENCY_LABELS } from "@/features/recurring/types/recurring.types";
import { AmountInput } from "@/features/transactions/components/amount-input";
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
  const action =
    mode === FORM_MODE.CREATE ? createRecurringAction : updateRecurringAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? "Recurring transaction created successfully"
          : "Recurring transaction updated successfully";
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
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-amount">Amount</Label>
        <AmountInput name="amount" defaultValue={defaultValues?.amount} />
        {!state.success && state.fieldErrors?.amount && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-description">Description</Label>
        <Input
          id="rec-description"
          name="description"
          type="text"
          defaultValue={defaultValues?.description}
          required
          placeholder="e.g. Netflix subscription"
        />
        {!state.success && state.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-notes">Notes (optional)</Label>
        <Textarea
          id="rec-notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Any additional details..."
        />
        {!state.success && state.fieldErrors?.notes && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.notes[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? "EXPENSE"} items={[{ value: "INCOME", label: "Income" }, { value: "EXPENSE", label: "Expense" }, { value: "TRANSFER", label: "Transfer" }]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
          {!state.success && state.fieldErrors?.type && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.type[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Payment Method</Label>
          <Select
            name="paymentMethod"
            defaultValue={defaultValues?.paymentMethod ?? "CASH"}
            items={[{ value: "CASH", label: "Cash" }, { value: "DEBIT", label: "Debit" }, { value: "CREDIT", label: "Credit" }, { value: "TRANSFER", label: "Transfer" }, { value: "OTHER", label: "Other" }]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="DEBIT">Debit</SelectItem>
              <SelectItem value="CREDIT">Credit</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {!state.success && state.fieldErrors?.paymentMethod && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.paymentMethod[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Frequency</Label>
          <Select
            name="frequency"
            defaultValue={defaultValues?.frequency ?? "MONTHLY"}
            items={Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!state.success && state.fieldErrors?.frequency && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.frequency[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-interval">Interval</Label>
          <Input
            id="rec-interval"
            name="interval"
            type="number"
            min={1}
            max={365}
            defaultValue={defaultValues?.interval ?? 1}
            required
          />
          {!state.success && state.fieldErrors?.interval && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.interval[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Start Date</Label>
          <DatePicker
            name="startDate"
            defaultValue={
              defaultValues
                ? formatDateForInput(defaultValues.startDate)
                : undefined
            }
            required
            placeholder="Select start date"
          />
          {!state.success && state.fieldErrors?.startDate && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.startDate[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>End Date (optional)</Label>
          <DatePicker
            name="endDate"
            defaultValue={
              defaultValues?.endDate
                ? formatDateForInput(defaultValues.endDate)
                : undefined
            }
            placeholder="Select end date"
          />
          {!state.success && state.fieldErrors?.endDate && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.endDate[0]}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
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
          ? "Saving..."
          : mode === FORM_MODE.CREATE
            ? "Create Recurring"
            : "Update Recurring"}
      </Button>
    </form>
  );
}
