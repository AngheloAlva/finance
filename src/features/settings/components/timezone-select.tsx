"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONES } from "@/shared/lib/constants";

interface TimezoneSelectProps {
  name: string;
  defaultValue?: string;
  error?: string;
}

export function TimezoneSelect({
  name,
  defaultValue,
  error,
}: TimezoneSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value} label={tz.label}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
