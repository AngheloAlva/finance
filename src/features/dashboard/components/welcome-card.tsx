"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { openQuickAdd } from "@/features/transactions/lib/quick-add-events"
import { Link } from "@/i18n/navigation"

interface WelcomeCardProps {
	name: string
	currency: string
}

/** First-run card shown on the dashboard while the account has no transactions. */
export function WelcomeCard({ name, currency }: WelcomeCardProps) {
	const t = useTranslations("dashboard.welcome")
	const firstName = name.trim().split(/\s+/)[0]

	return (
		<section className="bg-accent text-accent-foreground flex flex-col gap-4 rounded-xl p-5 md:p-6">
			<div className="flex flex-col gap-1.5">
				<h2 className="text-lg font-semibold">{t("title", { name: firstName })}</h2>
				<p className="text-sm">{t("body")}</p>
			</div>
			<Button size="lg" className="w-full md:w-fit" onClick={openQuickAdd}>
				<Plus data-icon="inline-start" />
				{t("cta")}
			</Button>
			<p className="text-xs">
				{t("currency", { currency })}{" "}
				<Link href="/settings" className="font-medium underline underline-offset-4">
					{t("changeCurrency")}
				</Link>
			</p>
		</section>
	)
}
