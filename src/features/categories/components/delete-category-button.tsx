"use client"

import { useTranslations } from "next-intl"

import { deleteCategoryAction } from "@/features/categories/actions/delete-category.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const t = useTranslations("categories");

  return (
    <DeleteEntityButton
      action={deleteCategoryAction}
      formEntries={{ id: categoryId }}
      dialogTitle={t("deleteDialog.title")}
      dialogDescription={t("deleteDialog.description", { name: categoryName })}
      successMessage={t("deleteDialog.success")}
    />
  );
}
