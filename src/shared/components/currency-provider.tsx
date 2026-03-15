"use client";

import { createContext, use } from "react";

import type { CurrencyCode } from "@/shared/lib/constants";

const CurrencyContext = createContext<CurrencyCode>("USD");

interface CurrencyProviderProps {
	currency: CurrencyCode;
	children: React.ReactNode;
}

export function CurrencyProvider({ currency, children }: CurrencyProviderProps) {
	return <CurrencyContext value={currency}>{children}</CurrencyContext>;
}

export function useCurrency(): CurrencyCode {
	return use(CurrencyContext);
}
