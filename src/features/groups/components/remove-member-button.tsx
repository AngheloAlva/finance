"use client";

import { useTranslations } from "next-intl";

import { removeMemberAction } from "@/features/groups/actions/remove-member.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface RemoveMemberButtonProps {
  groupId: string;
  memberId: string;
  memberName: string;
}

export function RemoveMemberButton({
  groupId,
  memberId,
  memberName,
}: RemoveMemberButtonProps) {
  const t = useTranslations("groups.members.removeMember");
  return (
    <DeleteEntityButton
      action={removeMemberAction}
      formEntries={{ groupId, memberId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: memberName })}
      successMessage={t("success")}
    />
  );
}
