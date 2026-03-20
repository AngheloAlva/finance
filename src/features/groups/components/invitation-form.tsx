"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMemberAction } from "@/features/groups/actions/invite-member.action";
import { FieldError } from "@/shared/components/field-error";
import type { ActionResult } from "@/shared/types/common.types";

interface InvitationFormProps {
  groupId: string;
}

const initialState: ActionResult<{ token: string }> = {
  success: false,
  error: "",
};

export function InvitationForm({ groupId }: InvitationFormProps) {
  const t = useTranslations("groups.invitation");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    inviteMemberAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(t("sentSuccess"));
    }
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {tErrors(state.error as Parameters<typeof tErrors>[0])}
        </div>
      )}

      {state.success && (
        <div className="rounded-none border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <p className="font-medium">{t("created")}</p>
          <p className="mt-1 break-all">
            {t("shareLink")}{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              {typeof window !== "undefined"
                ? `${window.location.origin}/invite/${state.data.token}`
                : `/invite/${state.data.token}`}
            </code>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">{t("emailLabel")}</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
        />
        {!state.success && <FieldError errors={state.fieldErrors?.email} />}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("sending") : t("sendInvitation")}
      </Button>
    </form>
  );
}
