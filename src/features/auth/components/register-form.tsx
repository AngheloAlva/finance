"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/features/auth/actions/register.action";
import { FieldError } from "@/shared/components/field-error";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    registerAction,
    INITIAL_VOID_STATE,
  );

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
          placeholder={t("namePlaceholder")}
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
          placeholder={t("emailPlaceholder")}
          required
          autoComplete="email"
          aria-invalid={
            !state.success && state.fieldErrors?.email ? true : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.email} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t("minCharacters")}
          required
          autoComplete="new-password"
          aria-invalid={
            !state.success && state.fieldErrors?.password ? true : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.password} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder={t("confirmPasswordPlaceholder")}
          required
          autoComplete="new-password"
          aria-invalid={
            !state.success && state.fieldErrors?.confirmPassword
              ? true
              : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.confirmPassword} />}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? t("creatingAccount") : t("createAccount")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
