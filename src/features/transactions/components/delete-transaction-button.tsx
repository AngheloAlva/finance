"use client"

import { useTranslations } from "next-intl"

import { deleteTransactionAction } from "@/features/transactions/actions/delete-transaction.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteTransactionButtonProps {
  transactionId: string;
  transactionDescription: string;
}

export function DeleteTransactionButton({
  transactionId,
  transactionDescription,
}: DeleteTransactionButtonProps) {
  const t = useTranslations("transactions");

  return (
    <DeleteEntityButton
      action={deleteTransactionAction}
      formEntries={{ id: transactionId }}
      dialogTitle={t("deleteDialog.title")}
      dialogDescription={t("deleteDialog.description", { name: transactionDescription })}
      successMessage={t("deleteDialog.success")}
    />
  );
}
