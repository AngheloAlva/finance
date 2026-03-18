"use client";

import { useActionState, useEffect } from "react";
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
  const [state, formAction, isPending] = useActionState(
    changeRoleAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Role updated successfully");
    }

    if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

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
        { value: "ADMIN", label: "Admin" },
        { value: "MEMBER", label: "Member" },
      ]}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="MEMBER">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}
