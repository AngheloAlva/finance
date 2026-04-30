import type { useTranslations } from "next-intl"

import { PaymentMethod } from "@/generated/prisma/enums"

const PAYMENT_METHOD_KEYS = {
	[PaymentMethod.CASH]: "cash",
	[PaymentMethod.DEBIT]: "debit",
	[PaymentMethod.CREDIT]: "credit",
	[PaymentMethod.TRANSFER]: "transfer",
	[PaymentMethod.OTHER]: "other",
} as const

export function getPaymentMethodOptions(
	t: ReturnType<typeof useTranslations<"transactions">>,
): { value: PaymentMethod; label: string }[] {
	return (Object.keys(PAYMENT_METHOD_KEYS) as PaymentMethod[]).map((value) => ({
		value,
		label: t(`paymentMethods.${PAYMENT_METHOD_KEYS[value]}`),
	}))
}
