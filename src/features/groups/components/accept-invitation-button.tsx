"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/features/groups/actions/accept-invitation.action";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface AcceptInvitationButtonProps {
  token: string;
}

export function AcceptInvitationButton({
  token,
}: AcceptInvitationButtonProps) {
  const [state, formAction, isPending] = useActionState(
    acceptInvitationAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      {!state.success && state.error && (
        <div className="mb-4 rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Accepting..." : "Accept Invitation"}
      </Button>
    </form>
  );
}
