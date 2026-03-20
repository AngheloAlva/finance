"use client"

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { HealthScoreResult } from "@/features/analytics/types/analytics.types"

interface FinancialHealthGaugeProps {
	score: HealthScoreResult
	compact?: boolean
}

function getScoreColor(overall: number): string {
	if (overall >= 80) return "var(--color-emerald-500)"
	if (overall >= 65) return "var(--color-green-500)"
	if (overall >= 50) return "var(--color-amber-400)"
	if (overall >= 35) return "var(--color-orange-500)"
	return "var(--color-red-500)"
}

function getScoreBarColor(overall: number): string {
	if (overall >= 80) return "#10b981"
	if (overall >= 65) return "#22c55e"
	if (overall >= 50) return "#fbbf24"
	if (overall >= 35) return "#f97316"
	return "#ef4444"
}

function getFactorBarColor(score: number): string {
	if (score >= 70) return "bg-emerald-500"
	if (score >= 50) return "bg-amber-400"
	if (score >= 30) return "bg-orange-500"
	return "bg-red-500"
}

export function FinancialHealthGauge({ score, compact = false }: FinancialHealthGaugeProps) {
	const t = useTranslations("analytics.financialHealth")
	const gaugeData = [
		{
			name: "Score",
			value: score.overall,
			fill: getScoreBarColor(score.overall),
		},
	]

	const gaugeHeight = compact ? 160 : 200

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{!score.hasEnoughData ? (
					<div className="flex items-center justify-center" style={{ height: gaugeHeight }}>
						<p className="text-muted-foreground text-sm">
							{t("noData")}
						</p>
					</div>
				) : (
					<div>
						{/* Gauge */}
						<div className="relative" style={{ height: gaugeHeight }}>
							<ResponsiveContainer width="100%" height={gaugeHeight}>
								<RadialBarChart
									cx="50%"
									cy="50%"
									innerRadius={compact ? 50 : 60}
									outerRadius={compact ? 70 : 85}
									startAngle={180}
									endAngle={0}
									data={gaugeData}
									barSize={compact ? 12 : 16}
								>
									<RadialBar
										dataKey="value"
										cornerRadius={8}
										background={{ fill: "var(--color-muted)" }}
									/>
								</RadialBarChart>
							</ResponsiveContainer>

							{/* Center text overlay */}
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span
									className="text-3xl font-bold"
									style={{ color: getScoreColor(score.overall) }}
								>
									{score.overall}
								</span>
								<span className="text-muted-foreground text-sm">{score.label}</span>
							</div>
						</div>

						{/* Factor breakdown (only in full mode) */}
						{!compact && score.factors.length > 0 && (
							<div className="mt-4 space-y-3">
								{score.factors.map((factor) => (
									<div key={factor.name}>
										<div className="mb-1 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">{factor.name}</span>
											<span className="font-medium">{factor.score}/100</span>
										</div>
										<div className="bg-muted h-1.5 w-full rounded-none">
											<div
												className={`h-full rounded-none ${getFactorBarColor(factor.score)}`}
												style={{ width: `${factor.score}%` }}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
