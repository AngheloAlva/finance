"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

const PRESET_VALUES = ["30d", "3m", "6m", "12m", "ytd"] as const;

const PRESET_LABEL_KEYS: Record<string, string> = {
  "30d": "last30Days",
  "3m": "last3Months",
  "6m": "last6Months",
  "12m": "last12Months",
  ytd: "yearToDate",
} as const;

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
  const t = useTranslations("analytics.dateRange");
  const router = useRouter();
  const searchParams = useSearchParams();

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
      {PRESET_VALUES.map((value) => (
        <Button
          key={value}
          variant={currentPreset === value ? "default" : "outline"}
          size="sm"
          onClick={() => selectPreset(value)}
        >
          {t(PRESET_LABEL_KEYS[value])}
        </Button>
      ))}

      <div className="flex items-center gap-1">
        <DatePicker
          value={from}
          onChange={(value) => handleCustomDate("from", value)}
          className="h-8 w-[160px] text-xs"
          placeholder={t("from")}
        />
        <span className="text-xs text-muted-foreground">{t("to")}</span>
        <DatePicker
          value={to}
          onChange={(value) => handleCustomDate("to", value)}
          className="h-8 w-[160px] text-xs"
          placeholder={t("from")}
        />
      </div>
    </div>
  );
}
