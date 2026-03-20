"use client"

import { GlobeIcon } from "lucide-react"
import { useLocale } from "next-intl"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/config"
import { locales } from "@/i18n/config"

const LOCALE_LABELS: Record<Locale, string> = {
	en: "EN",
	es: "ES",
}

export function LocaleSwitcher() {
	const locale = useLocale() as Locale
	const router = useRouter()
	const pathname = usePathname()

	function handleCycle() {
		const currentIndex = locales.indexOf(locale)
		const nextIndex = (currentIndex + 1) % locales.length
		const nextLocale = locales[nextIndex]

		router.replace(pathname, { locale: nextLocale })
	}

	return (
		<Button variant="ghost" size="icon-sm" onClick={handleCycle}>
			<GlobeIcon className="size-4" />
			<span className="text-[10px] font-medium">{LOCALE_LABELS[locale]}</span>
			<span className="sr-only">Switch language</span>
		</Button>
	)
}
