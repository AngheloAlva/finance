"use client"

import { useActionState, useEffect, useState } from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createOpeningBalanceAction } from "@/features/dashboard/actions/create-opening-balance.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { openQuickAdd } from "@/features/transactions/lib/quick-add-events"
import { Link } from "@/i18n/navigation"
import { FieldError } from "@/shared/components/field-error"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface WelcomeCardProps {
	name: string
	currency: string
}

/** First-run card shown on the dashboard while the account has no transactions. */
export function WelcomeCard({ name, currency }: WelcomeCardProps) {
	const t = useTranslations("dashboard.welcome")
	const tErrors = useTranslations("errors")
	const firstName = name.trim().split(/\s+/)[0]

	const [state, formAction, isPending] = useActionState(
		createOpeningBalanceAction,
		INITIAL_VOID_STATE,
	)
	// The user's local day, like the quick-add form, so the balance starts today.
	const [today] = useState(() => format(new Date(), "yyyy-MM-dd"))

	useEffect(() => {
		if (state.success && state !== INITIAL_VOID_STATE) {
			toast.success(t("openingBalance.saved"))
		}
	}, [state, t])

	return (
		<section className="bg-accent text-accent-foreground flex flex-col gap-5 rounded-xl p-5 md:p-6">
			<div className="flex flex-col gap-1.5">
				<h2 className="text-lg font-semibold">{t("title", { name: firstName })}</h2>
				<p className="text-sm">{t("body")}</p>
			</div>

			<form action={formAction} className="flex flex-col gap-3">
				<input type="hidden" name="date" value={today} />
				<input type="hidden" name="description" value={t("openingBalance.description")} />
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="opening-balance-amount">{t("openingBalance.label")}</Label>
					<p className="text-xs">{t("openingBalance.hint")}</p>
					<AmountInput id="opening-balance-amount" name="amount" className="bg-background" />
					{!state.success && <FieldError errors={state.fieldErrors?.amount} />}
				</div>
				{!state.success && state.error && (
					<p className="text-destructive text-xs">
						{tErrors(state.error as Parameters<typeof tErrors>[0])}
					</p>
				)}
				<Button type="submit" size="lg" className="w-full md:w-fit" disabled={isPending}>
					{t("openingBalance.submit")}
				</Button>
			</form>

			<div className="flex flex-col gap-2 border-t border-current/10 pt-4">
				<p className="text-xs">{t("orStartWithExpense")}</p>
				<Button variant="outline" className="w-full md:w-fit" onClick={openQuickAdd}>
					<Plus data-icon="inline-start" />
					{t("cta")}
				</Button>
			</div>

			<p className="text-xs">
				{t("currency", { currency })}{" "}
				<Link href="/settings" className="font-medium underline underline-offset-4">
					{t("changeCurrency")}
				</Link>
			</p>
		</section>
	)
}
