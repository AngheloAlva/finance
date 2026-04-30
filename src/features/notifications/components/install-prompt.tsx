"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export function InstallPrompt() {
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
		<div className="bg-card border-border flex items-start gap-3 rounded-lg border p-3 text-sm shadow-sm">
			<Download className="text-primary mt-0.5 size-4 shrink-0" />
			<div className="flex-1">
				<p className="font-medium">Install Finance</p>
				{isIOS ? (
					<p className="text-muted-foreground mt-0.5">
						Tap the share button{" "}
						<span role="img" aria-label="share">
							⎋
						</span>{" "}
						then "Add to Home Screen"{" "}
						<span role="img" aria-label="plus">
							➕
						</span>
					</p>
				) : (
					<p className="text-muted-foreground mt-0.5">
						Add to your home screen for a better experience
					</p>
				)}
			</div>
			{!isIOS && deferredPrompt && (
				<Button size="sm" onClick={install}>
					Install
				</Button>
			)}
			<button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
				<X className="size-4" />
			</button>
		</div>
	)
}
