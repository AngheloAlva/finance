"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCompactCurrency, formatCurrency } from "@/shared/lib/formatters"
import { cn } from "@/lib/utils"

import type { CategoryComparisonItem } from "@/features/analytics/types/analytics.types"

interface CategoryComparisonChartProps {
	data: CategoryComparisonItem[]
	currency: CurrencyCode
	/** Label of the earlier period (period1) */
	period1Label: string
	/** Label of the selected period (period2) */
	period2Label: string
}

const CHART_CATEGORY_LIMIT = 8

const CHART_COLORS = {
	period1: "var(--color-blue-500)",
	period2: "var(--color-violet-500)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

interface TooltipPayloadItem {
	name: string
	value: number
	color: string
}

function CustomTooltip({
	active,
	payload,
	label,
	currency,
	locale,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	locale?: string
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-lg border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency, locale)}
				</p>
			))}
		</div>
	)
}

export function CategoryComparisonChart({
	data,
	currency,
	period1Label,
	period2Label,
}: CategoryComparisonChartProps) {
	const t = useTranslations("analytics.categoryComparison")
	const locale = useLocale()
	const chartData = data.slice(0, CHART_CATEGORY_LIMIT)

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>
					{t("description", { current: period2Label, previous: period1Label })}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				) : (
					<>
					<ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 44)}>
						<BarChart data={chartData} layout="vertical" barGap={2}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
							<XAxis
								type="number"
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
							/>
							<YAxis
								type="category"
								dataKey="categoryName"
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								width={100}
							/>
							<Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
							<Legend
								iconType="circle"
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Bar
								dataKey="period1Total"
								name={period1Label}
								fill={CHART_COLORS.period1}
								radius={[0, 4, 4, 0]}
							/>
							<Bar
								dataKey="period2Total"
								name={period2Label}
								fill={CHART_COLORS.period2}
								radius={[0, 4, 4, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
					<ComparisonTable data={data} currency={currency} locale={locale} />
					</>
				)}
			</CardContent>
		</Card>
	)
}

const DIRECTION_ICONS = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const
const DIRECTION_COLORS = {
	up: "text-red-500",
	down: "text-emerald-500",
	flat: "text-muted-foreground",
} as const

function ComparisonTable({
	data,
	currency,
	locale,
}: {
	data: CategoryComparisonItem[]
	currency: CurrencyCode
	locale: string
}) {
	const t = useTranslations("analytics.categoryComparison")

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{t("category")}</TableHead>
					<TableHead className="text-right">{t("previous")}</TableHead>
					<TableHead className="text-right">{t("current")}</TableHead>
					<TableHead className="text-right">{t("change")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((item) => {
					const direction = item.change > 0 ? "up" : item.change < 0 ? "down" : "flat"
					const Icon = DIRECTION_ICONS[direction]
					return (
						<TableRow key={item.categoryId}>
							<TableCell>
								<div className="flex items-center gap-2">
									<span
										className="inline-block size-2 shrink-0 rounded-full"
										style={{ backgroundColor: item.categoryColor }}
									/>
									<span className="text-sm">{item.categoryName}</span>
								</div>
							</TableCell>
							<TableCell className="text-muted-foreground text-right text-sm">
								<CurrencyDisplay cents={item.period1Total} currency={currency} locale={locale} />
							</TableCell>
							<TableCell className="text-right text-sm">
								<CurrencyDisplay cents={item.period2Total} currency={currency} locale={locale} />
							</TableCell>
							<TableCell>
								<div
									className={cn(
										"flex items-center justify-end gap-1 text-sm font-medium tabular-nums",
										DIRECTION_COLORS[direction],
									)}
								>
									<Icon className="size-3" />
									<span>
										{item.change > 0 ? "+" : ""}
										{item.change}%
									</span>
								</div>
							</TableCell>
						</TableRow>
					)
				})}
			</TableBody>
		</Table>
	)
}
