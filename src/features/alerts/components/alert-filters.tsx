"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Read", value: "READ" },
  { label: "Dismissed", value: "DISMISSED" },
] as const;

export function AlertFilters() {
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
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
