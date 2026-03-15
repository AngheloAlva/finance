"use client";

import { useActionState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { settleSplitAction } from "@/features/group-finances/actions/settle-split.action";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface SettleButtonProps {
  splitId: string;
  isPaid: boolean;
  onSettle?: () => void;
}

export function SettleButton({ splitId, isPaid, onSettle }: SettleButtonProps) {
  const [state, formAction, isPending] = useActionState(
    settleSplitAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(isPaid ? "Split marked as unpaid" : "Split marked as paid");
      onSettle?.();
    }

    if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state, isPaid, onSettle]);

  function handleClick() {
    const formData = new FormData();
    formData.set("splitId", splitId);
    formAction(formData);
  }

  return (
    <Button
      variant={isPaid ? "ghost" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={isPaid ? "text-emerald-500" : "text-red-500"}
    >
      {isPaid ? (
        <>
          <Check className="size-3" />
          Paid
        </>
      ) : (
        <>
          <X className="size-3" />
          Unpaid
        </>
      )}
    </Button>
  );
}
