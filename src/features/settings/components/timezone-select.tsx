"use client";

import { useTranslations } from "next-intl";

import { FieldError } from "@/shared/components/field-error";
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
  const t = useTranslations("settings");

  return (
    <div className="flex flex-col gap-1.5">
      <Select name={name} defaultValue={defaultValue} items={TIMEZONES}>
        <SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={t("selectTimezone")} />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={error} />
    </div>
  );
}
