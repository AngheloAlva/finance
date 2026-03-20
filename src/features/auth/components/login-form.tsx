"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/features/auth/actions/login.action";
import { FieldError } from "@/shared/components/field-error";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

export function LoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    loginAction,
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
          placeholder={t("passwordPlaceholder")}
          required
          autoComplete="current-password"
          aria-invalid={
            !state.success && state.fieldErrors?.password ? true : undefined
          }
        />
        {!state.success && <FieldError errors={state.fieldErrors?.password} />}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? t("signingIn") : t("signIn")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          {t("createOne")}
        </Link>
      </p>
    </form>
  );
}
