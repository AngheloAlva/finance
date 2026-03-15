"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGroupAction } from "@/features/groups/actions/create-group.action";
import { updateGroupAction } from "@/features/groups/actions/update-group.action";
import { CURRENCIES } from "@/shared/lib/constants";
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types";

interface GroupFormProps {
  mode: FormMode;
  defaultValues?: {
    id: string;
    name: string;
    description: string | null;
    currency: string;
  };
  onSuccess?: () => void;
}

export function GroupForm({ mode, defaultValues, onSuccess }: GroupFormProps) {
  const action =
    mode === FORM_MODE.CREATE ? createGroupAction : updateGroupAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? "Group created successfully"
          : "Group updated successfully";
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
        <Label htmlFor="group-name">Name</Label>
        <Input
          id="group-name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          required
          placeholder="e.g. Apartment expenses"
        />
        {!state.success && state.fieldErrors?.name && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="group-description">Description</Label>
        <Textarea
          id="group-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Optional description for this group"
          rows={3}
        />
        {!state.success && state.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Currency</Label>
        <Select
          name="currency"
          defaultValue={defaultValues?.currency ?? "USD"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code} label={`${currency.code} - ${currency.name}`}>
                {currency.code} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!state.success && state.fieldErrors?.currency && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.currency[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? "Saving..."
          : mode === FORM_MODE.CREATE
            ? "Create Group"
            : "Update Group"}
      </Button>
    </form>
  );
}
