"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateRecurringAction } from "@/features/recurring/actions/generate-recurring.action";

interface GenerateButtonProps {
  pendingCount: number;
}

export function GenerateButton({ pendingCount }: GenerateButtonProps) {
  const t = useTranslations("recurring");
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    const result = await generateRecurringAction();
    setIsPending(false);

    if (result.success) {
      toast.success(t("generateResult", { count: result.data.count }));
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
      {t("generate")}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {pendingCount}
        </Badge>
      )}
    </Button>
  );
}
