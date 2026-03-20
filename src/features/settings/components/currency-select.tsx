"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { FieldError } from "@/shared/components/field-error";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/shared/lib/constants";

interface CurrencySelectProps {
  name: string;
  defaultValue?: string;
  error?: string;
}

export function CurrencySelect({
  name,
  defaultValue,
  error,
}: CurrencySelectProps) {
  const t = useTranslations("settings");
  const items = useMemo(
    () =>
      CURRENCIES.map((currency) => ({
        value: currency.code,
        label: `${currency.code} - ${currency.name}`,
      })),
    []
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Select name={name} defaultValue={defaultValue} items={items}>
        <SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={t("selectCurrency")} />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={error} />
    </div>
  );
}
