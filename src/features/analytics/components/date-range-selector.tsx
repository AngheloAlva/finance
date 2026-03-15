"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { getDateRangePresets } from "@/features/analytics/lib/analytics.utils";

interface DateRangeSelectorProps {
  currentPreset: string;
  from: string;
  to: string;
}

export function DateRangeSelector({
  currentPreset,
  from,
  to,
}: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presets = getDateRangePresets();

  function selectPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", value);
    params.delete("from");
    params.delete("to");
    router.push(`/analytics?${params.toString()}`);
  }

  function handleCustomDate(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(field, value);
    params.set("preset", "custom");

    if (field === "from") {
      params.set("to", to);
    } else {
      params.set("from", from);
    }

    router.push(`/analytics?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={currentPreset === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => selectPreset(preset.value)}
        >
          {preset.label}
        </Button>
      ))}

      <div className="flex items-center gap-1">
        <DatePicker
          value={from}
          onChange={(value) => handleCustomDate("from", value)}
          className="h-8 w-[160px] text-xs"
          placeholder="From"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <DatePicker
          value={to}
          onChange={(value) => handleCustomDate("to", value)}
          className="h-8 w-[160px] text-xs"
          placeholder="To"
        />
      </div>
    </div>
  );
}
