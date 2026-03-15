"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateRecurringAction } from "@/features/recurring/actions/generate-recurring.action";

interface GenerateButtonProps {
  pendingCount: number;
}

export function GenerateButton({ pendingCount }: GenerateButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    const result = await generateRecurringAction();
    setIsPending(false);

    if (result.success) {
      toast.success(
        `Generated ${result.data.count} transaction${result.data.count === 1 ? "" : "s"}`,
      );
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={pendingCount === 0 || isPending}
    >
      <RefreshCw
        className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
        data-icon="inline-start"
      />
      Generate
      {pendingCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {pendingCount}
        </Badge>
      )}
    </Button>
  );
}
