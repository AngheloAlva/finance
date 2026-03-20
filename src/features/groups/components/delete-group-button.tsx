"use client";

import { useTranslations } from "next-intl";

import { deleteGroupAction } from "@/features/groups/actions/delete-group.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
}

export function DeleteGroupButton({
  groupId,
  groupName,
}: DeleteGroupButtonProps) {
  const t = useTranslations("groups.settings.deleteDialog");
  return (
    <DeleteEntityButton
      action={deleteGroupAction}
      formEntries={{ id: groupId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: groupName })}
      successMessage={t("success")}
    />
  );
}
