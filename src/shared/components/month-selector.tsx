"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

interface MonthSelectorProps {
  month: number;
  year: number;
  buildHref: (month: number, year: number) => string;
}

export function MonthSelector({ month, year, buildHref }: MonthSelectorProps) {
  const router = useRouter();

  function navigateMonth(direction: -1 | 1) {
    let newMonth = month + direction;
    let newYear = year;

    if (newMonth === 0) {
      newMonth = 12;
      newYear--;
    } else if (newMonth === 13) {
      newMonth = 1;
      newYear++;
    }

    router.push(buildHref(newMonth, newYear));
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(-1)}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-medium">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(1)}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
