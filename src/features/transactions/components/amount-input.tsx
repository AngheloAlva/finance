"use client";

import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";
import { useCurrency } from "@/shared/components/currency-provider";
import { centsToDisplay, parseCurrencyInput } from "@/shared/lib/formatters";
import { cn } from "@/lib/utils";

const ZERO_DECIMAL_CURRENCIES = ["JPY", "CLP"] as const;

function isZeroDecimal(code: string): boolean {
	return (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(code);
}

interface AmountInputProps {
	name: string;
	defaultValue?: number;
	className?: string;
}

export function AmountInput({ name, defaultValue, className }: AmountInputProps) {
	const currencyCode = useCurrency();
	const zeroDecimal = isZeroDecimal(currencyCode);

	const [display, setDisplay] = useState(() =>
		defaultValue !== undefined ? centsToDisplay(defaultValue, currencyCode) : "",
	);

	const handleBlur = useCallback(() => {
		const cleaned = display.replace(/[^0-9.-]/g, "");
		const value = parseFloat(cleaned);

		if (!Number.isNaN(value) && value > 0) {
			setDisplay(zeroDecimal ? Math.round(value).toString() : value.toFixed(2));
		}
	}, [display, zeroDecimal]);

	const cents = parseCurrencyInput(display, currencyCode);

	return (
		<>
			<input type="hidden" name={name} value={cents || ""} />
			<Input
				type="text"
				inputMode={zeroDecimal ? "numeric" : "decimal"}
				placeholder={zeroDecimal ? "0" : "0.00"}
				value={display}
				onChange={(e) => setDisplay(e.target.value)}
				onBlur={handleBlur}
				className={cn(className)}
			/>
		</>
	);
}
