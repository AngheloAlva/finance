"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMemberAction } from "@/features/groups/actions/invite-member.action";
import type { ActionResult } from "@/shared/types/common.types";

interface InvitationFormProps {
  groupId: string;
}

const initialState: ActionResult<{ token: string }> = {
  success: false,
  error: "",
};

export function InvitationForm({ groupId }: InvitationFormProps) {
  const [state, formAction, isPending] = useActionState(
    inviteMemberAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Invitation sent successfully");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />

      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-none border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <p className="font-medium">Invitation created!</p>
          <p className="mt-1 break-all">
            Share this link:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              {typeof window !== "undefined"
                ? `${window.location.origin}/invite/${state.data.token}`
                : `/invite/${state.data.token}`}
            </code>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Email Address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="member@example.com"
        />
        {!state.success && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
