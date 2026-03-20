"use client";

import { useTranslations } from "next-intl";

import { deleteGroupTransactionAction } from "@/features/group-finances/actions/delete-group-transaction.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupTransactionButtonProps {
  transactionId: string;
  transactionDescription: string;
}

export function DeleteGroupTransactionButton({
  transactionId,
  transactionDescription,
}: DeleteGroupTransactionButtonProps) {
  const t = useTranslations("groupFinances.deleteTransaction");
  return (
    <DeleteEntityButton
      action={deleteGroupTransactionAction}
      formEntries={{ id: transactionId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: transactionDescription })}
      successMessage={t("success")}
    />
  );
}
