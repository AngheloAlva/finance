import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BudgetCard } from "@/features/budgets/components/budget-card"
import { BudgetDialog } from "@/features/budgets/components/budget-dialog"
import { CopyBudgetsButton } from "@/features/budgets/components/copy-budgets-button"
import { getBudgetsWithSpending } from "@/features/budgets/lib/budgets.queries"
import { getUserCategories } from "@/features/categories/lib/categories.queries"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { Link } from "@/i18n/navigation"
import { MonthSelector } from "@/shared/components/month-selector"
import { requireSession } from "@/shared/lib/auth"
import type { CurrencyCode } from "@/shared/lib/constants"

interface BudgetsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseMonthYear(params: Record<string, string | string[] | undefined>) {
	const now = new Date()
	const rawMonth = typeof params.month === "string" ? parseInt(params.month, 10) : NaN
	const rawYear = typeof params.year === "string" ? parseInt(params.year, 10) : NaN
	const month = !Number.isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1
	const year = !Number.isNaN(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear()
	return { month, year }
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
	const session = await requireSession()
	const rawParams = await searchParams
	const { month, year } = parseMonthYear(rawParams)
	const currency = (session.user.currency ?? "USD") as CurrencyCode
	const t = await getTranslations("budgets")

	const [budgets, categories] = await Promise.all([
		getBudgetsWithSpending(session.user.id, month, year),
		getUserCategories(session.user.id),
	])

	const typedCategories = categories as CategoryWithChildren[]

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">{t("title")}</h1>
				<MonthSelector
					month={month}
					year={year}
					buildHref={(m, y) => `/budgets?month=${m}&year=${y}`}
				/>
			</div>

			<div className="flex items-center gap-2">
				<BudgetDialog
					categories={typedCategories}
					month={month}
					year={year}
					trigger={
						<Button size="sm">
							<Plus className="size-3.5" data-icon="inline-start" />
							{t("setBudget")}
						</Button>
					}
				/>
				<CopyBudgetsButton month={month} year={year} />
			</div>

			{budgets.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
						<p className="text-muted-foreground text-sm">{t("noBudgets")}</p>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col gap-3">
					{budgets.map((item) => (
						<BudgetCard key={item.budget.id} item={item} currency={currency} />
					))}
				</div>
			)}
		</div>
	)
}
