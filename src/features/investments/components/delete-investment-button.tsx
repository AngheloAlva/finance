"use client";

import { useTranslations } from "next-intl";

import { deleteInvestmentAction } from "@/features/investments/actions/delete-investment.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteInvestmentButtonProps {
  investmentId: string;
  investmentName: string;
}

export function DeleteInvestmentButton({
  investmentId,
  investmentName,
}: DeleteInvestmentButtonProps) {
  const t = useTranslations("investments.deleteDialog");

  return (
    <DeleteEntityButton
      action={deleteInvestmentAction}
      formEntries={{ id: investmentId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: investmentName })}
    />
  );
}
