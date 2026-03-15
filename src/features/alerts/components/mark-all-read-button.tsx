"use client";

import { useActionState } from "react";
import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markAllReadAction } from "@/features/alerts/actions/mark-all-read.action";
import type { ActionResult } from "@/shared/types/common.types";

const initialState: ActionResult<{ count: number }> = {
  success: true,
  data: { count: 0 },
};

export function MarkAllReadButton() {
  const [, action, isPending] = useActionState(
    async () => {
      return markAllReadAction();
    },
    initialState,
  );

  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <CheckCheck className="size-4" />
        {isPending ? "Marking..." : "Mark All as Read"}
      </Button>
    </form>
  );
}
