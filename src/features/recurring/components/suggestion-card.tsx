"use client"

import { useActionState, useEffect } from "react"
import { Check, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { acceptSuggestionAction } from "@/features/recurring/actions/accept-suggestion.action"
import { skipSuggestionAction } from "@/features/recurring/actions/skip-suggestion.action"
import {
	FREQUENCY_KEYS,
	type RecurringTemplateWithRule,
} from "@/features/recurring/types/recurring.types"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatDate } from "@/shared/lib/formatters"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface SuggestionCardProps {
	template: RecurringTemplateWithRule
	currency: CurrencyCode
}

export function SuggestionCard({ template, currency }: SuggestionCardProps) {
	const t = useTranslations("recurring.suggestions")
	const tFreq = useTranslations("recurring.frequencies")
	const tCard = useTranslations("recurring.card")
	const locale = useLocale()

	const [acceptState, acceptAction, isAccepting] = useActionState(
		acceptSuggestionAction,
		INITIAL_VOID_STATE,
	)
	const [skipState, skipAction, isSkipping] = useActionState(
		skipSuggestionAction,
		INITIAL_VOID_STATE,
	)

	const rule = template.recurrenceRule
	const frequencyLabel = tFreq(FREQUENCY_KEYS[rule.frequency] as Parameters<typeof tFreq>[0])
	const frequencyText =
		rule.interval > 1
			? tCard("everyInterval", { interval: rule.interval, frequency: frequencyLabel.toLowerCase() })
			: frequencyLabel

	useEffect(() => {
		if (acceptState.success) toast.success(t("accepted"))
		if (!acceptState.success && acceptState.error) toast.error(acceptState.error)
	}, [acceptState, t])

	useEffect(() => {
		if (skipState.success) toast.success(t("skipped"))
		if (!skipState.success && skipState.error) toast.error(skipState.error)
	}, [skipState, t])

	const isPending = isAccepting || isSkipping

	return (
		<div className="flex flex-col gap-3 border-b p-4 last:border-b-0">
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<span className="text-sm font-medium">{template.description}</span>
					<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
						<span
							className="inline-block size-2 rounded-none"
							style={{ backgroundColor: template.category.color }}
						/>
						<span>{template.category.name}</span>
						<span>·</span>
						<span>{frequencyText}</span>
					</div>
					<span className="text-muted-foreground text-xs">
						{formatDate(rule.nextGenerationDate, "short", locale)}
					</span>
				</div>
				<CurrencyDisplay
					cents={template.amount}
					currency={currency}
					className="text-sm font-medium"
					locale={locale}
				/>
			</div>

			<form className="flex flex-col gap-2">
				<input type="hidden" name="templateId" value={template.id} />
				<div className="flex items-center gap-2">
					<div className="flex-1">
						<AmountInput name="amount" defaultValue={template.amount} className="h-8 text-xs" />
					</div>
					<Button
						type="submit"
						formAction={acceptAction}
						size="sm"
						disabled={isPending}
						className="gap-1"
					>
						<Check className="size-3" />
						{t("accept")}
					</Button>
					<Button
						type="submit"
						formAction={skipAction}
						variant="outline"
						size="sm"
						disabled={isPending}
						className="gap-1"
					>
						<X className="size-3" />
						{t("skip")}
					</Button>
				</div>
			</form>
		</div>
	)
}
