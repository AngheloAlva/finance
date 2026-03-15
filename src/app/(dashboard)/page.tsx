import type { CurrencyCode } from "@/shared/lib/constants"
import { requireSession } from "@/shared/lib/auth"
import {
	checkCreditCardAlerts,
	checkFinancialHealthAlerts,
} from "@/features/alerts/lib/alert-generation"
import { getCreditCards } from "@/features/credit-cards/lib/credit-cards.queries"
import { generatePendingRecurring } from "@/features/recurring/lib/generate-recurring"

import {
	getCategoryBreakdown,
	getMonthlyFlow,
	getMonthlyOverview,
	getPortfolioSummary,
	getRecentTransactions,
	getTopActiveGoals,
} from "@/features/dashboard/lib/dashboard.queries"
import { getFinancialHealthScore } from "@/features/analytics/lib/analytics.queries"
import { FinancialHealthGauge } from "@/features/analytics/components/financial-health-gauge"
import { CategoryChart } from "@/features/dashboard/components/category-chart"
import { GoalProgressWidget } from "@/features/dashboard/components/goal-progress-widget"
import { MonthSelector } from "@/features/dashboard/components/month-selector"
import { MonthlyFlowChart } from "@/features/dashboard/components/monthly-flow-chart"
import { OverviewCards } from "@/features/dashboard/components/overview-cards"
import { PortfolioSummaryCard } from "@/features/dashboard/components/portfolio-summary-card"
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions"

interface DashboardPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseMonthYear(params: Record<string, string | string[] | undefined>) {
	const now = new Date()

	const rawMonth = typeof params.month === "string" ? parseInt(params.month, 10) : NaN
	const rawYear = typeof params.year === "string" ? parseInt(params.year, 10) : NaN

	const month =
		!Number.isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1

	const year =
		!Number.isNaN(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear()

	return { month, year }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
	const session = await requireSession()
	const rawParams = await searchParams
	const { month, year } = parseMonthYear(rawParams)
	const currency = (session.user.currency ?? "USD") as CurrencyCode

	// Generate any pending recurring transactions before fetching dashboard data
	await generatePendingRecurring(session.user.id)

	const [
		overview,
		categoryBreakdown,
		monthlyFlow,
		recentTransactions,
		creditCards,
		topGoals,
		portfolioSummary,
		healthScore,
	] = await Promise.all([
		getMonthlyOverview(session.user.id, month, year),
		getCategoryBreakdown(session.user.id, month, year),
		getMonthlyFlow(session.user.id, month, year),
		getRecentTransactions(session.user.id),
		getCreditCards(session.user.id),
		getTopActiveGoals(session.user.id, 3),
		getPortfolioSummary(session.user.id),
		getFinancialHealthScore(session.user.id),
	])

	// Check alerts in the background (fire-and-forget)
	try {
		await Promise.all([
			checkCreditCardAlerts(
				creditCards.map((card) => ({
					id: card.id,
					name: card.name,
					totalLimit: card.totalLimit,
					closingDay: card.closingDay,
					paymentDay: card.paymentDay,
				})),
				session.user.id
			),
			checkFinancialHealthAlerts(session.user.id),
		])
	} catch {
		// Never block dashboard rendering
	}

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Dashboard</h1>
				<MonthSelector month={month} year={year} />
			</div>

			<OverviewCards overview={overview} currency={currency} />

			<FinancialHealthGauge score={healthScore} compact />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<CategoryChart data={categoryBreakdown} currency={currency} />
				<MonthlyFlowChart data={monthlyFlow} currency={currency} />
			</div>

			<GoalProgressWidget goals={topGoals} currency={currency} />

			<PortfolioSummaryCard portfolio={portfolioSummary} currency={currency} />

			<RecentTransactions transactions={recentTransactions} currency={currency} />
		</div>
	)
}
