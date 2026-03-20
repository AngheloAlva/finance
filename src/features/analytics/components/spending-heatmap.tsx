"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

import type { DailySpendingItem } from "@/features/analytics/types/analytics.types"

interface SpendingHeatmapProps {
	data: DailySpendingItem[]
	currency: CurrencyCode
	from: string
	to: string
}

function getLocaleDayLabels(locale: string): string[] {
	// Generate Mon, "", Wed, "", Fri, "", Sun using Intl
	const baseDate = new Date(2024, 0, 1) // Monday Jan 1 2024
	const labels: string[] = []
	for (let i = 0; i < 7; i++) {
		const d = new Date(baseDate)
		d.setDate(baseDate.getDate() + i)
		// Only show Mon(0), Wed(2), Fri(4), Sun(6)
		labels.push(i % 2 === 0 ? d.toLocaleDateString(locale, { weekday: "short" }) : "")
	}
	return labels
}

function getLocaleMonthLabel(monthIndex: number, locale: string): string {
	return new Date(2024, monthIndex).toLocaleDateString(locale, { month: "short" })
}

function getIntensityClass(amount: number, thresholds: number[]): string {
	if (amount === 0) return "bg-muted"
	if (amount <= thresholds[0]) return "bg-emerald-200 dark:bg-emerald-900"
	if (amount <= thresholds[1]) return "bg-emerald-400 dark:bg-emerald-700"
	if (amount <= thresholds[2]) return "bg-red-300 dark:bg-red-800"
	if (amount <= thresholds[3]) return "bg-red-400 dark:bg-red-600"
	return "bg-red-500 dark:bg-red-500"
}

function getPercentile(sorted: number[], p: number): number {
	const idx = Math.ceil((p / 100) * sorted.length) - 1
	return sorted[Math.max(0, idx)]
}

export function SpendingHeatmap({ data, currency, from, to }: SpendingHeatmapProps) {
	const t = useTranslations("analytics.spendingHeatmap")
	const locale = useLocale()
	const [tooltip, setTooltip] = useState<{
		date: string
		amount: number
		x: number
		y: number
	} | null>(null)

	const dayLabels = useMemo(() => getLocaleDayLabels(locale), [locale])

	const { grid, monthHeaders, thresholds } = useMemo(() => {
		// Build a map of date -> amount
		const dataMap = new Map(data.map((d) => [d.date, d]))

		// Calculate percentile thresholds from non-zero values
		const amounts = data
			.map((d) => d.total)
			.filter((a) => a > 0)
			.sort((a, b) => a - b)
		const t =
			amounts.length > 0
				? [
						getPercentile(amounts, 25),
						getPercentile(amounts, 50),
						getPercentile(amounts, 75),
						getPercentile(amounts, 90),
					]
				: [0, 0, 0, 0]

		// Generate all days in range
		const startDate = new Date(from)
		const endDate = new Date(to)

		// Adjust start to previous Monday
		const startDay = startDate.getDay()
		const mondayOffset = startDay === 0 ? -6 : 1 - startDay
		const gridStart = new Date(startDate)
		gridStart.setDate(gridStart.getDate() + mondayOffset)

		const cells: Array<{
			date: string
			amount: number
			dayOfWeek: number
			weekIndex: number
			inRange: boolean
		}> = []

		const months: Array<{ label: string; weekIndex: number }> = []
		let lastMonth = -1
		let weekIndex = 0

		const current = new Date(gridStart)
		while (current <= endDate || current.getDay() !== 1) {
			if (current > endDate && current.getDay() === 1) break

			const dayOfWeek = current.getDay() === 0 ? 6 : current.getDay() - 1 // Mon=0, Sun=6
			const dateStr = current.toISOString().split("T")[0]
			const item = dataMap.get(dateStr)
			const inRange = current >= startDate && current <= endDate

			if (dayOfWeek === 0 && cells.length > 0) {
				weekIndex++
			}

			// Track month headers
			const currentMonthIdx = current.getMonth()
			if (currentMonthIdx !== lastMonth) {
				months.push({ label: getLocaleMonthLabel(currentMonthIdx, locale), weekIndex })
				lastMonth = currentMonthIdx
			}

			cells.push({
				date: dateStr,
				amount: item?.total ?? 0,
				dayOfWeek,
				weekIndex,
				inRange,
			})

			current.setDate(current.getDate() + 1)
		}

		// Organize into grid: weeks as columns, days as rows
		const totalWeeks = weekIndex + 1
		const gridData: Array<Array<(typeof cells)[0] | null>> = Array.from({ length: 7 }, () =>
			Array.from({ length: totalWeeks }, () => null)
		)

		for (const cell of cells) {
			gridData[cell.dayOfWeek][cell.weekIndex] = cell
		}

		return { grid: gridData, monthHeaders: months, thresholds: t }
	}, [data, from, to, locale])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				) : (
					<div className="relative overflow-x-auto">
						{/* Month headers */}
						<div className="ml-8 flex">
							{monthHeaders.map((m, i) => (
								<div
									key={`${m.label}-${i}`}
									className="text-muted-foreground text-xs"
									style={{
										position: "absolute",
										left: `${m.weekIndex * 16 + 32}px`,
									}}
								>
									{m.label}
								</div>
							))}
						</div>

						{/* Grid */}
						<div className="mt-5 flex gap-0">
							{/* Day labels */}
							<div className="flex w-8 shrink-0 flex-col gap-[2px]">
								{dayLabels.map((label, i) => (
									<div key={i} className="text-muted-foreground flex h-3 items-center text-[10px]">
										{label}
									</div>
								))}
							</div>

							{/* Cells grid */}
							<div
								className="grid gap-[2px]"
								style={{
									gridTemplateRows: "repeat(7, 12px)",
									gridAutoFlow: "column",
									gridAutoColumns: "12px",
								}}
							>
								{grid.flatMap((row, dayIdx) =>
									row.map((cell, weekIdx) => (
										<div
											key={`${dayIdx}-${weekIdx}`}
											className={`size-3 rounded-none ${
												cell && cell.inRange
													? getIntensityClass(cell.amount, thresholds)
													: "bg-transparent"
											}`}
											onMouseEnter={(e) => {
												if (cell && cell.inRange) {
													const rect = e.currentTarget.getBoundingClientRect()
													setTooltip({
														date: cell.date,
														amount: cell.amount,
														x: rect.left + rect.width / 2,
														y: rect.top - 8,
													})
												}
											}}
											onMouseLeave={() => setTooltip(null)}
										/>
									))
								)}
							</div>
						</div>

						{/* Tooltip */}
						{tooltip && (
							<div
								className="bg-popover pointer-events-none fixed z-50 rounded-none border px-3 py-2 text-sm shadow-md"
								style={{
									left: tooltip.x,
									top: tooltip.y,
									transform: "translate(-50%, -100%)",
								}}
							>
								<p className="font-medium">{tooltip.date}</p>
								<p className="text-muted-foreground">{formatCurrency(tooltip.amount, currency, locale)}</p>
							</div>
						)}

						{/* Legend */}
						<div className="text-muted-foreground mt-3 flex items-center gap-1 text-[10px]">
							<span>{t("less")}</span>
							<div className="bg-muted size-3 rounded-none" />
							<div className="size-3 rounded-none bg-emerald-200 dark:bg-emerald-900" />
							<div className="size-3 rounded-none bg-emerald-400 dark:bg-emerald-700" />
							<div className="size-3 rounded-none bg-red-300 dark:bg-red-800" />
							<div className="size-3 rounded-none bg-red-400 dark:bg-red-600" />
							<div className="size-3 rounded-none bg-red-500" />
							<span>{t("more")}</span>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
