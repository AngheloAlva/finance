import { getTranslations } from "next-intl/server"

import type { CurrencyCode } from "@/shared/lib/constants"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import {
	checkCreditCardAlerts,
	checkFinancialHealthAlerts,
} from "@/features/alerts/lib/alert-generation"
import { getCreditCards } from "@/features/credit-cards/lib/credit-cards.queries"
import { getBudgetSummary } from "@/features/budgets/lib/budgets.queries"
import { BudgetSummaryWidget } from "@/features/budgets/components/budget-summary-widget"
import { generatePendingRecurring } from "@/features/recurring/lib/generate-recurring"
import { getPendingSuggestions } from "@/features/recurring/lib/recurring.queries"
import { SuggestionDrawer } from "@/features/recurring/components/suggestion-drawer"

import {
	getCategoryBreakdown,
	getMonthlyFlow,
	getMonthlyOverview,
	getPortfolioSummary,
	getRecentTransactions,
	getTopActiveGoals,
} from "@/features/dashboard/lib/dashboard.queries"
import {
	getFinancialHealthScore,
	getMonthComparison,
} from "@/features/analytics/lib/analytics.queries"
import { FinancialHealthGauge } from "@/features/analytics/components/financial-health-gauge"
import { MonthComparisonWidget } from "@/features/analytics/components/month-comparison-widget"
import { MonthlyDigestWidget } from "@/features/analytics/components/monthly-digest-widget"
import { CategoryChart } from "@/features/dashboard/components/category-chart"
import { DashboardCustomizer } from "@/features/dashboard/components/dashboard-customizer"
import { GoalProgressWidget } from "@/features/dashboard/components/goal-progress-widget"
import { MonthSelector } from "@/features/dashboard/components/month-selector"
import { MonthlyFlowChart } from "@/features/dashboard/components/monthly-flow-chart"
import { OverviewCards } from "@/features/dashboard/components/overview-cards"
import { PortfolioSummaryCard } from "@/features/dashboard/components/portfolio-summary-card"
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions"
import { WidgetWrapper } from "@/features/dashboard/components/widget-wrapper"
import {
	mergeDashboardConfig,
	type WidgetConfig,
	type WidgetKey,
} from "@/features/dashboard/lib/dashboard.schema"

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
	const t = await getTranslations("dashboard")

	// Load the user's dashboard customization (falls back to default if null/invalid)
	const userRecord = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { dashboardConfig: true },
	})
	const config = mergeDashboardConfig(userRecord?.dashboardConfig)

	// Figure out which widgets are visible so we only fetch data we need.
	const visibleKeys = new Set<WidgetKey>(
		config.widgets.filter((w) => w.visible).map((w) => w.key),
	)
	const needs = (key: WidgetKey) => visibleKeys.has(key)

	// Generate any pending recurring transactions before fetching dashboard data
	await generatePendingRecurring(session.user.id)

	// Conditional Promise.all — each query runs only if its widget is visible.
	// Credit cards are also needed for the alert generation below.
	const [
		overview,
		categoryBreakdown,
		monthlyFlow,
		recentTransactions,
		creditCards,
		topGoals,
		portfolioSummary,
		healthScore,
		pendingSuggestions,
		budgetSummary,
		monthComparison,
	] = await Promise.all([
		needs("overview") ? getMonthlyOverview(session.user.id, month, year) : null,
		needs("categoryBreakdown") ? getCategoryBreakdown(session.user.id, month, year) : null,
		needs("monthlyFlow") ? getMonthlyFlow(session.user.id, month, year) : null,
		needs("recentTransactions") ? getRecentTransactions(session.user.id) : null,
		getCreditCards(session.user.id),
		needs("goals") ? getTopActiveGoals(session.user.id, 3) : null,
		needs("portfolio") ? getPortfolioSummary(session.user.id, currency) : null,
		needs("financialHealth") ? getFinancialHealthScore(session.user.id) : null,
		getPendingSuggestions(session.user.id),
		needs("budgetSummary") ? getBudgetSummary(session.user.id, month, year) : null,
		needs("monthComparison") ? getMonthComparison(session.user.id, month, year) : null,
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

	// Render a single widget based on its config entry. Returns null when the
	// widget is hidden or when its data didn't load (should not happen in
	// practice because we only fetch for visible widgets).
	const renderWidget = (w: WidgetConfig) => {
		if (!w.visible) return null

		switch (w.key) {
			case "overview":
				return overview ? <OverviewCards overview={overview} currency={currency} /> : null
			case "financialHealth":
				return healthScore ? <FinancialHealthGauge score={healthScore} compact /> : null
			case "categoryBreakdown":
				return categoryBreakdown ? (
					<CategoryChart data={categoryBreakdown} currency={currency} />
				) : null
			case "monthlyFlow":
				return monthlyFlow ? (
					<MonthlyFlowChart data={monthlyFlow} currency={currency} />
				) : null
			case "monthComparison":
				return monthComparison ? (
					<MonthComparisonWidget comparison={monthComparison} currency={currency} />
				) : null
			case "goals":
				return topGoals ? <GoalProgressWidget goals={topGoals} currency={currency} /> : null
			case "budgetSummary":
				return budgetSummary ? (
					<BudgetSummaryWidget summary={budgetSummary} currency={currency} />
				) : null
			case "portfolio":
				return portfolioSummary ? (
					<PortfolioSummaryCard portfolio={portfolioSummary} currency={currency} />
				) : null
			case "monthlyDigest":
				return <MonthlyDigestWidget month={month} year={year} />
			case "recentTransactions":
				return recentTransactions ? (
					<RecentTransactions transactions={recentTransactions} currency={currency} />
				) : null
		}
	}

	const orderedWidgets = [...config.widgets].sort((a, b) => a.position - b.position)

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">{t("title")}</h1>
				<div className="flex items-center gap-2">
					<DashboardCustomizer initialConfig={config} />
					<SuggestionDrawer suggestions={pendingSuggestions} currency={currency} />
					<MonthSelector month={month} year={year} />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{orderedWidgets.map((w) => {
					const content = renderWidget(w)
					if (!content) return null
					return (
						<WidgetWrapper key={w.key} size={w.size}>
							{content}
						</WidgetWrapper>
					)
				})}
			</div>
		</div>
	)
}
