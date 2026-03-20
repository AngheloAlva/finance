"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { labelKey: "all", value: "" },
  { labelKey: "pending", value: "PENDING" },
  { labelKey: "read", value: "READ" },
  { labelKey: "dismissed", value: "DISMISSED" },
] as const;

export function AlertFilters() {
  const t = useTranslations("alerts.filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";

  function handleFilter(status: string) {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    params.set("page", "1");
    router.push(`/alerts?${params.toString()}`);
  }

  return (
    <div className="flex gap-1">
      {FILTER_TABS.map((tab) => (
        <Button
          key={tab.value}
          variant="ghost"
          size="sm"
          onClick={() => handleFilter(tab.value)}
          className={cn(
            currentStatus === tab.value && "bg-muted",
          )}
        >
          {t(tab.labelKey)}
        </Button>
      ))}
    </div>
  );
}
