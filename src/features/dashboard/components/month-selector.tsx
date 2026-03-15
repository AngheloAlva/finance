"use client";

import { MonthSelector as SharedMonthSelector } from "@/shared/components/month-selector";

interface MonthSelectorProps {
  month: number;
  year: number;
}

export function MonthSelector({ month, year }: MonthSelectorProps) {
  return (
    <SharedMonthSelector
      month={month}
      year={year}
      buildHref={(m, y) => `/?month=${m}&year=${y}`}
    />
  );
}
