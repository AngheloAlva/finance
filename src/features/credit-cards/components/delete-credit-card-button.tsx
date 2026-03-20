"use client"

import { useTranslations } from "next-intl"

import { deleteCreditCardAction } from "@/features/credit-cards/actions/delete-credit-card.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteCreditCardButtonProps {
  creditCardId: string;
  creditCardName: string;
}

export function DeleteCreditCardButton({
  creditCardId,
  creditCardName,
}: DeleteCreditCardButtonProps) {
  const t = useTranslations("creditCards");

  return (
    <DeleteEntityButton
      action={deleteCreditCardAction}
      formEntries={{ id: creditCardId }}
      dialogTitle={t("deleteDialog.title")}
      dialogDescription={t("deleteDialog.description", { name: creditCardName })}
      successMessage={t("deleteDialog.success")}
    />
  );
}
