"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySelect } from "@/features/settings/components/currency-select";
import { TimezoneSelect } from "@/features/settings/components/timezone-select";
import { updateProfileAction } from "@/features/settings/actions/update-profile.action";
import { FieldError } from "@/shared/components/field-error";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    currency: string;
    timezone: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(t("profileUpdated"));
    }
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {tErrors(state.error as Parameters<typeof tErrors>[0])}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={user.name}
          required
          autoComplete="name"
          aria-invalid={
            !state.success && state.fieldErrors?.name ? true : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.name} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          disabled
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          {t("emailCannotChange")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">{t("avatarUrl")}</Label>
        <Input
          id="image"
          name="image"
          type="text"
          defaultValue={user.image ?? ""}
          placeholder={t("avatarPlaceholder")}
          autoComplete="photo"
          aria-invalid={
            !state.success && state.fieldErrors?.image ? true : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.image} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("currency")}</Label>
        <CurrencySelect
          name="currency"
          defaultValue={user.currency}
          error={
            !state.success ? state.fieldErrors?.currency?.[0] : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("timezone")}</Label>
        <TimezoneSelect
          name="timezone"
          defaultValue={user.timezone}
          error={
            !state.success ? state.fieldErrors?.timezone?.[0] : undefined
          }
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? t("saving") : t("saveChanges")}
      </Button>
    </form>
  );
}
