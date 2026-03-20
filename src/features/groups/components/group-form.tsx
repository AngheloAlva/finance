"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { FieldError } from "@/shared/components/field-error";
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
  const t = useTranslations("groups.form");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const action =
    mode === FORM_MODE.CREATE ? createGroupAction : updateGroupAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE);

  const currencyItems = useMemo(
    () => CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })),
    [],
  );

  useEffect(() => {
    if (state.success) {
      const message =
        mode === FORM_MODE.CREATE
          ? t("createdSuccess")
          : t("updatedSuccess");
      toast.success(message);
      onSuccess?.();
    }
  }, [state, mode, onSuccess, t]);

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
        <Label htmlFor="group-name">{t("name")}</Label>
        <Input
          id="group-name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name}
          required
          placeholder={t("namePlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.name} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="group-description">{t("description")}</Label>
        <Textarea
          id="group-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.description} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("currency")}</Label>
        <Select
          name="currency"
          defaultValue={defaultValues?.currency ?? "USD"}
          items={currencyItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectCurrency")} />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!state.success && <FieldError errors={state.fieldErrors?.currency} />}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending
          ? tc("saving")
          : mode === FORM_MODE.CREATE
            ? t("createGroup")
            : t("updateGroup")}
      </Button>
    </form>
  );
}
