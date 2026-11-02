"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

export function InstallPrompt() {
	const t = useTranslations("install")
	const [isIOS, setIsIOS] = useState(false)
	const [isStandalone, setIsStandalone] = useState(false)
	const [dismissed, setDismissed] = useState(false)
	const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)

	useEffect(() => {
		setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
		setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
		setDismissed(localStorage.getItem("pwa-install-dismissed") === "1")

		const handler = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as Event & { prompt: () => Promise<void> })
		}
		window.addEventListener("beforeinstallprompt", handler)
		return () => window.removeEventListener("beforeinstallprompt", handler)
	}, [])

	function dismiss() {
		localStorage.setItem("pwa-install-dismissed", "1")
		setDismissed(true)
	}

	async function install() {
		if (!deferredPrompt) return
		await deferredPrompt.prompt()
		setDeferredPrompt(null)
		dismiss()
	}

	if (isStandalone || dismissed) return null
	if (!isIOS && !deferredPrompt) return null

	return (
		<div className="bg-card flex items-center gap-3 border p-3 text-sm md:hidden">
			<Download className="text-muted-foreground size-4 shrink-0" />
			<div className="min-w-0 flex-1">
				<p className="font-medium">{t("title")}</p>
				<p className="text-muted-foreground mt-0.5 text-xs">
					{isIOS ? t("iosDescription") : t("description")}
				</p>
			</div>
			{!isIOS && deferredPrompt && (
				<Button size="sm" onClick={install}>
					{t("action")}
				</Button>
			)}
			<button
				onClick={dismiss}
				aria-label={t("dismiss")}
				className="text-muted-foreground hover:text-foreground -m-2 p-2"
			>
				<X className="size-4" />
			</button>
		</div>
	)
}
