"use client";

import type { ReactElement } from "react";
import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import type { ActionResult } from "@/shared/types/common.types";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface DeleteEntityButtonProps {
  action: (
    state: ActionResult<void>,
    payload: FormData,
  ) => ActionResult<void> | Promise<ActionResult<void>>;
  formEntries: Record<string, string>;
  dialogTitle: string;
  dialogDescription: string;
  successMessage?: string;
  trigger?: ReactElement;
}

export function DeleteEntityButton({
  action,
  formEntries,
  dialogTitle,
  dialogDescription,
  successMessage,
  trigger,
}: DeleteEntityButtonProps) {
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success && successMessage) {
      toast.success(successMessage);
    }

    if (!state.success && state.error) {
      toast.error(tErrors(state.error as Parameters<typeof tErrors>[0]));
    }
  }, [state, successMessage, tErrors]);

  function handleConfirm() {
    const formData = new FormData();

    for (const [key, value] of Object.entries(formEntries)) {
      formData.set(key, value);
    }

    formAction(formData);
  }

  const defaultTrigger = (
    <Button variant="ghost" size="icon-xs" disabled={isPending}>
      <Trash2 className="size-3" />
    </Button>
  );

  return (
    <ConfirmDialog
      trigger={trigger ?? defaultTrigger}
      title={dialogTitle}
      description={dialogDescription}
      onConfirm={handleConfirm}
      destructive
      loading={isPending}
    />
  );
}
