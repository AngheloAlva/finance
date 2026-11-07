"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { enUS, es } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DATE_RANGE_PRESET_VALUES,
  formatRangeLabel,
  type DateRangePresetValue,
} from "@/features/analytics/lib/analytics-filters";

const PRESET_LABEL_KEYS: Record<DateRangePresetValue, string> = {
  thisMonth: "thisMonth",
  lastMonth: "lastMonth",
  "30d": "last30Days",
  "3m": "last3Months",
  "6m": "last6Months",
  "12m": "last12Months",
  ytd: "yearToDate",
};

/** Date key (YYYY-MM-DD) to the local midnight the calendar works with. */
function keyToLocalDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function localDateToKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

interface DateRangeSelectorProps {
  currentPreset: string;
  from: string;
  to: string;
  onPresetChange: (preset: DateRangePresetValue) => void;
  onRangeChange: (from: string, to: string) => void;
}

export function DateRangeSelector({
  currentPreset,
  from,
  to,
  onPresetChange,
  onRangeChange,
}: DateRangeSelectorProps) {
  const t = useTranslations("analytics.dateRange");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>();

  const isPreset = (DATE_RANGE_PRESET_VALUES as readonly string[]).includes(currentPreset);
  const triggerLabel = isPreset
    ? t(PRESET_LABEL_KEYS[currentPreset as DateRangePresetValue])
    : formatRangeLabel(from, to, locale);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setDraft({ from: keyToLocalDate(from), to: keyToLocalDate(to) });
    setOpen(nextOpen);
  }

  function selectPreset(value: DateRangePresetValue) {
    setOpen(false);
    onPresetChange(value);
  }

  function applyDraft() {
    if (!draft?.from) return;
    setOpen(false);
    onRangeChange(localDateToKey(draft.from), localDateToKey(draft.to ?? draft.from));
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="justify-start font-normal"
            aria-label={t("label")}
          />
        }
      >
        <CalendarIcon className="size-3.5" data-icon="inline-start" />
        <span className="truncate">{triggerLabel}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-wrap gap-1 border-b p-2 md:w-40 md:flex-col md:flex-nowrap md:border-r md:border-b-0">
            {DATE_RANGE_PRESET_VALUES.map((value) => (
              <Button
                key={value}
                variant={currentPreset === value ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => selectPreset(value)}
              >
                {t(PRESET_LABEL_KEYS[value])}
              </Button>
            ))}
          </div>
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={(range, day) =>
                // With a complete range shown, a click starts a new one instead of moving an end
                setDraft((current) =>
                  current?.from && current.to ? { from: day, to: undefined } : range,
                )
              }
              numberOfMonths={isMobile ? 1 : 2}
              defaultMonth={
                draft?.to && !isMobile
                  ? new Date(draft.to.getFullYear(), draft.to.getMonth() - 1, 1)
                  : draft?.to
              }
              locale={locale.startsWith("es") ? es : enUS}
              className="p-3"
            />
            <div className="flex items-center justify-between gap-3 border-t p-2">
              <span
                className={cn(
                  "text-xs tabular-nums",
                  draft?.from ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {draft?.from
                  ? formatRangeLabel(
                      localDateToKey(draft.from),
                      localDateToKey(draft.to ?? draft.from),
                      locale,
                    )
                  : t("pickRange")}
              </span>
              <Button size="sm" onClick={applyDraft} disabled={!draft?.from}>
                {t("apply")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
