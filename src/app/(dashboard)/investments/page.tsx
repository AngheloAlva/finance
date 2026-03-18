import { InvestmentType } from "@/generated/prisma/enums"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InvestmentDialog } from "@/features/investments/components/investment-dialog"
import { InvestmentList } from "@/features/investments/components/investment-list"
import { PortfolioAllocationChart } from "@/features/investments/components/portfolio-allocation-chart"
import { getInvestments } from "@/features/investments/lib/investments.queries"
import { calculateAllocation } from "@/features/investments/lib/investments.utils"
import type { CurrencyCode } from "@/shared/lib/constants"
import { requireSession } from "@/shared/lib/auth"

interface InvestmentsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseFilters(params: Record<string, string | string[] | undefined>) {
	const type =
		typeof params.type === "string" &&
		Object.values(InvestmentType).includes(params.type as InvestmentType)
			? (params.type as InvestmentType)
			: undefined

	const isActive = typeof params.isActive === "string" ? params.isActive === "true" : undefined

	return { type, isActive }
}

export default async function InvestmentsPage({ searchParams }: InvestmentsPageProps) {
	const session = await requireSession()
	const rawParams = await searchParams
	const filters = parseFilters(rawParams)
	const currency = (session.user.currency ?? "USD") as CurrencyCode

	const investments = await getInvestments(session.user.id, filters)
	const activeInvestments = investments.filter((inv) => inv.isActive)
	const allocation = calculateAllocation(activeInvestments, currency)

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Investments</h1>
				<InvestmentDialog
					mode="create"
					trigger={
						<Button size="sm">
							<Plus className="size-3.5" data-icon="inline-start" />
							New Investment
						</Button>
					}
				/>
			</div>

			<InvestmentList investments={investments} userCurrency={currency} />

			{allocation.length > 0 && <PortfolioAllocationChart data={allocation} currency={currency} />}
		</div>
	)
}
