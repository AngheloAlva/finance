"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { RefreshCw, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { generateMonthlyDigestAction } from "@/features/analytics/actions/generate-monthly-digest.action"

interface MonthlyDigestWidgetProps {
	month: number
	year: number
}

export function MonthlyDigestWidget({ month, year }: MonthlyDigestWidgetProps) {
	const t = useTranslations("dashboard.monthlyDigest")
	const [text, setText] = useState<string | null>(null)
	const [error, setError] = useState(false)
	const [isPending, startTransition] = useTransition()

	const generate = useCallback(() => {
		startTransition(async () => {
			setError(false)
			const result = await generateMonthlyDigestAction(month, year)
			if ("error" in result) {
				setError(true)
			} else {
				setText(result.text)
			}
		})
	}, [month, year])

	useEffect(() => {
		generate()
	}, [generate])

	return (
		<div className="border bg-background p-4">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-xs font-medium">{t("title")}</span>
				</div>
				<button
					onClick={generate}
					disabled={isPending}
					className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
				>
					<RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
					{t("regenerate")}
				</button>
			</div>

			{isPending && !text && (
				<div className="space-y-1.5">
					<div className="h-3 w-full animate-pulse rounded-none bg-muted" />
					<div className="h-3 w-5/6 animate-pulse rounded-none bg-muted" />
					<div className="h-3 w-4/6 animate-pulse rounded-none bg-muted" />
				</div>
			)}

			{error && !isPending && (
				<p className="text-xs text-muted-foreground">{t("error")}</p>
			)}

			{text && !isPending && (
				<p className="text-xs/relaxed text-foreground">{text}</p>
			)}

			{text && isPending && (
				<p className="text-xs/relaxed text-muted-foreground/50">{text}</p>
			)}
		</div>
	)
}
