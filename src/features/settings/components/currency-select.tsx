"use client";

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
  return (
    <div className="flex flex-col gap-1.5">
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code} label={`${currency.code} - ${currency.name}`}>
              {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
