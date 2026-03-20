import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  cents: number;
  currency: CurrencyCode;
  colorize?: boolean;
  className?: string;
  locale?: string;
}

export function CurrencyDisplay({
  cents,
  currency,
  colorize = false,
  className,
  locale,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(cents, currency, locale);

  return (
    <span
      className={cn(
        colorize && cents > 0 && "text-emerald-500",
        colorize && cents < 0 && "text-red-500",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
