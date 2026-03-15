"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCategoryAction } from "@/features/categories/actions/create-category.action";
import { updateCategoryAction } from "@/features/categories/actions/update-category.action";
import { createGroupCategoryAction } from "@/features/groups/actions/create-group-category.action";
import { updateGroupCategoryAction } from "@/features/groups/actions/update-group-category.action";
import { CategoryColorPicker } from "@/features/categories/components/category-color-picker";
import { CategoryIconPicker } from "@/features/categories/components/category-icon-picker";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { useCurrency } from "@/shared/components/currency-provider";
import { centsToDisplay } from "@/shared/lib/formatters";
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types";

interface CategoryFormProps {
  mode: FormMode;
  defaultValues?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    transactionType: string;
    isRecurring: boolean;
    isAvoidable: boolean;
    alertThreshold: number | null;
    parentId: string | null;
  };
  categories: CategoryWithChildren[];
  groupId?: string;
  onSuccess?: () => void;
}

export function CategoryForm({
  mode,
  defaultValues,
  categories,
  groupId,
  onSuccess,
}: CategoryFormProps) {
  const action = groupId
    ? mode === FORM_MODE.CREATE
      ? createGroupCategoryAction
      : updateGroupCategoryAction
    : mode === FORM_MODE.CREATE
      ? createCategoryAction
      : updateCategoryAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);
  const currencyCode = useCurrency();
  const [transactionType, setTransactionType] = useState(
    defaultValues?.transactionType ?? "EXPENSE",
  );

  const rootCategories = categories.filter((c) => c.parentId === null);

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? "Category created successfully"
          : "Category updated successfully";
      toast.success(message);
      onSuccess?.();
    }
  }, [state, mode, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === FORM_MODE.EDIT && defaultValues && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <input type="hidden" name="currencyCode" value={currencyCode} />

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          required
          placeholder="e.g. Groceries"
          aria-invalid={
            !state.success && state.fieldErrors?.name ? true : undefined
          }
        />
        {!state.success && state.fieldErrors?.name && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Icon</Label>
        <CategoryIconPicker
          name="icon"
          value={defaultValues?.icon}
        />
        {!state.success && state.fieldErrors?.icon && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.icon[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Color</Label>
        <CategoryColorPicker
          name="color"
          value={defaultValues?.color}
        />
        {!state.success && state.fieldErrors?.color && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.color[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Transaction Type</Label>
        <Select
          name="transactionType"
          defaultValue={defaultValues?.transactionType ?? "EXPENSE"}
          onValueChange={(value) => setTransactionType(value ?? "EXPENSE")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME" label="Income">Income</SelectItem>
            <SelectItem value="EXPENSE" label="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        {!state.success && state.fieldErrors?.transactionType && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.transactionType[0]}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isRecurring">Recurring</Label>
        <Switch
          id="isRecurring"
          name="isRecurring"
          defaultChecked={defaultValues?.isRecurring ?? false}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isAvoidable">Avoidable</Label>
        <Switch
          id="isAvoidable"
          name="isAvoidable"
          defaultChecked={defaultValues?.isAvoidable ?? false}
        />
      </div>

      {transactionType === "EXPENSE" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alertThreshold">Alert threshold (optional)</Label>
          <Input
            id="alertThreshold"
            name="alertThreshold"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 500"
            defaultValue={
              defaultValues?.alertThreshold
                ? centsToDisplay(defaultValues.alertThreshold, currencyCode)
                : undefined
            }
            aria-invalid={
              !state.success && state.fieldErrors?.alertThreshold
                ? true
                : undefined
            }
          />
          <p className="text-xs text-muted-foreground">
            Get alerted when monthly spending in this category exceeds this
            amount
          </p>
          {!state.success && state.fieldErrors?.alertThreshold && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.alertThreshold[0]}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Parent Category</Label>
        <Select
          name="parentId"
          defaultValue={defaultValues?.parentId ?? ""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None (root category)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" label="None (root category)">None (root category)</SelectItem>
            {rootCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} label={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? "Saving..."
          : mode === FORM_MODE.CREATE
            ? "Create Category"
            : "Update Category"}
      </Button>
    </form>
  );
}
