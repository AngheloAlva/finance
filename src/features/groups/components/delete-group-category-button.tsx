"use client";

import { useTranslations } from "next-intl";

import { deleteGroupCategoryAction } from "@/features/groups/actions/delete-group-category.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  groupId: string;
}

export function DeleteGroupCategoryButton({
  categoryId,
  categoryName,
  groupId,
}: DeleteGroupCategoryButtonProps) {
  const t = useTranslations("groups.deleteCategory");
  return (
    <DeleteEntityButton
      action={deleteGroupCategoryAction}
      formEntries={{ id: categoryId, groupId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: categoryName })}
      successMessage={t("success")}
    />
  );
}
