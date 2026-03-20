"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeRoleAction } from "@/features/groups/actions/change-role.action";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface RoleSelectProps {
  groupId: string;
  memberId: string;
  currentRole: string;
}

export function RoleSelect({
  groupId,
  memberId,
  currentRole,
}: RoleSelectProps) {
  const t = useTranslations("groups.members");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    changeRoleAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(t("roleUpdatedSuccess"));
    }

    if (!state.success && state.error) {
      toast.error(tErrors(state.error as Parameters<typeof tErrors>[0]));
    }
  }, [state, t]);

  function handleChange(value: string | null) {
    if (!value || value === currentRole) return;

    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("memberId", memberId);
    formData.set("role", value);
    formAction(formData);
  }

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={handleChange}
      disabled={isPending}
      items={[
        { value: "ADMIN", label: t("roleAdmin") },
        { value: "MEMBER", label: t("roleMember") },
      ]}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
        <SelectItem value="MEMBER">{t("roleMember")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
