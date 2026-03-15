"use client";

import { MonthSelector } from "@/shared/components/month-selector";

interface GroupMonthSelectorProps {
  groupId: string;
  month: number;
  year: number;
}

export function GroupMonthSelector({
  groupId,
  month,
  year,
}: GroupMonthSelectorProps) {
  return (
    <MonthSelector
      month={month}
      year={year}
      buildHref={(m, y) => `/groups/${groupId}/dashboard?month=${m}&year=${y}`}
    />
  );
}
