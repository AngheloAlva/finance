"use client"

import type { ReactElement } from "react"
import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteInstallmentGroupAction } from "@/features/transactions/actions/delete-installment-group.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteInstallmentGroupButtonProps {
  parentTransactionId: string;
  description: string;
  trigger?: ReactElement;
}

export function DeleteInstallmentGroupButton({
  parentTransactionId,
  description,
  trigger,
}: DeleteInstallmentGroupButtonProps) {
  const t = useTranslations("transactions");

  return (
    <DeleteEntityButton
      action={deleteInstallmentGroupAction}
      formEntries={{ parentTransactionId }}
      dialogTitle={t("deleteInstallmentDialog.title")}
      dialogDescription={t("deleteInstallmentDialog.description", { name: description })}
      successMessage={t("deleteInstallmentDialog.success")}
      trigger={
        trigger ?? <Button variant="ghost" size="icon-xs" title={t("deleteInstallmentDialog.deleteAll")}>
          <Trash2 className="size-3 text-destructive" />
        </Button>
      }
    />
  );
}
