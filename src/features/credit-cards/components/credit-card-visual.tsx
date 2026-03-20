import { getLocale, getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface CreditCardVisualProps {
	name: string
	brand: string
	lastFourDigits: string
	color: string
	totalLimit: number
	usedLimit: number
	currency?: CurrencyCode
	paymentDueDate?: Date
	className?: string
}

function getDaysUntilDue(dueDate: Date): number {
	const today = new Date()
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
	const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
	return Math.round((dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
}

export async function CreditCardVisual({
	name,
	brand,
	lastFourDigits,
	color,
	totalLimit,
	usedLimit,
	currency = "USD",
	paymentDueDate,
	className,
}: CreditCardVisualProps) {
	const t = await getTranslations("creditCards")
	const locale = await getLocale()
	const usagePercentage = totalLimit > 0 ? (usedLimit / totalLimit) * 100 : 0
	const available = Math.max(0, totalLimit - usedLimit)
	const daysUntilDue = paymentDueDate ? getDaysUntilDue(paymentDueDate) : null

	return (
		<div
			className={cn(
				"relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-none p-5 text-white shadow-lg",
				className
			)}
			style={{ backgroundColor: color }}
		>
			{/* Brand & Payment Alert */}
			<div className="flex items-start justify-between">
				<span className="text-xs font-medium tracking-wider uppercase opacity-80">{brand}</span>
				{daysUntilDue != null && daysUntilDue >= 0 && daysUntilDue <= 3 && (
					<span className="rounded-none bg-yellow-400/90 px-2 py-0.5 text-[10px] font-semibold text-yellow-900">
						{daysUntilDue === 0 ? t("visual.paymentDueToday") : t("visual.paymentDueIn", { days: daysUntilDue })}
					</span>
				)}
			</div>

			{/* Card Number */}
			<div className="flex items-center gap-3 font-mono text-sm tracking-widest">
				<span className="opacity-50">****</span>
				<span className="opacity-50">****</span>
				<span className="opacity-50">****</span>
				<span>{lastFourDigits}</span>
			</div>

			{/* Name & Usage */}
			<div className="flex flex-col gap-2">
				<span className="text-xs font-medium tracking-wide uppercase">{name}</span>

				{/* Usage bar */}
				<div className="flex flex-col gap-1">
					<div className="h-1.5 w-full overflow-hidden rounded-none bg-white/20">
						<div
							className={cn(
								"h-full rounded-none transition-all",
								usagePercentage > 95
									? "bg-red-400"
									: usagePercentage > 80
										? "bg-yellow-400"
										: "bg-white/80"
							)}
							style={{ width: `${Math.min(100, usagePercentage)}%` }}
						/>
					</div>
					<div className="flex items-center justify-between text-[10px] opacity-80">
						<span>{t("visual.used", { amount: formatCurrency(usedLimit, currency, locale) })}</span>
						<span>{t("visual.available", { amount: formatCurrency(available, currency, locale) })}</span>
					</div>
				</div>
			</div>
		</div>
	)
}
