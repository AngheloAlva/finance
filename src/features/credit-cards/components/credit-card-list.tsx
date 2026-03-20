import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils"
import { getCreditCards } from "@/features/credit-cards/lib/credit-cards.queries"
import { CreditCardVisual } from "@/features/credit-cards/components/credit-card-visual"

interface CreditCardListProps {
	userId: string
	currency: import("@/shared/lib/constants").CurrencyCode
}

export async function CreditCardList({ userId, currency }: CreditCardListProps) {
	const [cards, t] = await Promise.all([getCreditCards(userId), getTranslations("creditCards")])

	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-none border border-dashed p-12 text-center">
				<p className="text-muted-foreground text-sm">
					{t("noCardsYet")}
				</p>
			</div>
		)
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{cards.map((card) => {
				const { paymentDueDate } = computeStatementDates(
					card.closingDay,
					card.paymentDay,
					new Date()
				)

				return (
					<Link
						key={card.id}
						href={`/credit-cards/${card.id}`}
						className="transition-transform hover:scale-[1.02]"
					>
						<CreditCardVisual
							name={card.name}
							brand={card.brand}
							lastFourDigits={card.lastFourDigits}
							color={card.color}
							totalLimit={card.totalLimit}
							usedLimit={card.usedLimit}
							currency={currency}
							paymentDueDate={paymentDueDate}
						/>
					</Link>
				)
			})}
		</div>
	)
}
