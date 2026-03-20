"use client"

import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { InvestmentCard } from "@/features/investments/components/investment-card"
import type { Investment } from "@/features/investments/types/investments.types"
import type { CurrencyCode } from "@/shared/lib/constants"

interface InvestmentListProps {
	investments: Investment[]
	userCurrency: CurrencyCode
}

export function InvestmentList({ investments, userCurrency }: InvestmentListProps) {
	const t = useTranslations("investments")
	const locale = useLocale()

	if (investments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-none border border-dashed p-12 text-center">
				<p className="text-muted-foreground text-sm">
					{t("noInvestmentsYet")}
				</p>
			</div>
		)
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{investments.map((investment) => (
				<Link
					key={investment.id}
					href={`/investments/${investment.id}`}
					className="transition-transform hover:scale-[1.02]"
				>
					<InvestmentCard investment={investment} userCurrency={userCurrency} locale={locale} />
				</Link>
			))}
		</div>
	)
}
