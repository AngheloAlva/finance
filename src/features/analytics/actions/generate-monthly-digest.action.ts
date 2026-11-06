"use server"

import { unstable_cache } from "next/cache"
import { getLocale } from "next-intl/server"

import { getMonthComparison } from "@/features/analytics/lib/analytics.queries"
import { getMonthlyOverview } from "@/features/dashboard/lib/dashboard.queries"
import { requireSession } from "@/shared/lib/auth"
import { CLAUDE_MODEL, claude } from "@/shared/lib/claude"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

export type DigestResult = { text: string } | { empty: true } | { error: string }

interface DigestInput {
	userId: string
	month: number
	year: number
	currency: CurrencyCode
	locale: string
}

const buildDigest = unstable_cache(
	async (input: DigestInput): Promise<{ text: string } | { error: string }> => {
		const { userId, month, year, currency, locale } = input

		const [overview, comparison] = await Promise.all([
			getMonthlyOverview(userId, month, year),
			getMonthComparison(userId, month, year, locale),
		])

		const savingsRate =
			overview.totalIncome > 0
				? Math.round(((overview.totalIncome - overview.totalExpenses) / overview.totalIncome) * 100)
				: 0

		const fmt = (cents: number) => formatCurrency(cents, currency, locale)

		const topCategories = comparison.items
			.slice(0, 4)
			.map(
				(c) =>
					`${c.categoryName}: ${fmt(c.currentAmount)} (${c.changePercent > 0 ? "+" : ""}${c.changePercent}% vs last month)`,
			)
			.join("\n")

		const risingTrend = comparison.trends[0]
			? `Rising trend: ${comparison.trends[0].categoryName} up ${comparison.trends[0].totalIncreasePercent}% over 3 months.`
			: ""

		const language = locale === "es" ? "neutral Latin American Spanish (use tú, never vos), casual tone" : "English (friendly, casual)"

		const prompt = `You are a personal finance assistant. Write a SHORT narrative summary (2–3 sentences max) of the user's finances for ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}.

Financial data:
- Income: ${fmt(overview.totalIncome)}
- Expenses: ${fmt(overview.totalExpenses)}
- Net: ${fmt(overview.balance)} (${savingsRate}% savings rate)
- vs last month: overall expenses ${comparison.overallChangePercent > 0 ? "up" : "down"} ${Math.abs(comparison.overallChangePercent)}%
- Transactions recorded: ${overview.transactionCount}
${topCategories ? `\nTop spending categories:\n${topCategories}` : ""}
${risingTrend ? `\n${risingTrend}` : ""}

Write in ${language}. Be specific with numbers. Highlight what's notable — good savings, a spending spike, a rising category. Keep it under 60 words. Do NOT use markdown.`

		try {
			const response = await claude.messages.create({
				model: CLAUDE_MODEL,
				max_tokens: 16000,
				output_config: { effort: "low" },
				messages: [{ role: "user", content: prompt }],
			})

			const text = response.content
				.flatMap((block) => (block.type === "text" ? [block.text] : []))
				.join("")
				.trim()

			if (response.stop_reason === "refusal" || !text) return { error: "DIGEST_FAILED" }
			return { text }
		} catch {
			return { error: "DIGEST_FAILED" }
		}
	},
	["monthly-digest"],
	{ tags: ["monthly-digest"], revalidate: 60 * 60 * 12 },
)

export async function generateMonthlyDigestAction(
	month: number,
	year: number,
): Promise<DigestResult> {
	const session = await requireSession()
	const locale = await getLocale()
	const currency = (session.user.currency ?? "USD") as CurrencyCode

	// Checked outside the cache, so the first transaction of the month shows a
	// summary right away instead of a cached "empty" result.
	const { transactionCount } = await getMonthlyOverview(session.user.id, month, year)
	if (transactionCount === 0) return { empty: true }

	return buildDigest({ userId: session.user.id, month, year, currency, locale })
}
