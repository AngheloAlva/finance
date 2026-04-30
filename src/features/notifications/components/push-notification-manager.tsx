"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { subscribePush } from "../actions/subscribe-push.action"
import { unsubscribePush } from "../actions/unsubscribe-push.action"

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = window.atob(base64)
	const arr = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
	return arr.buffer
}

export function PushNotificationManager() {
	const [supported, setSupported] = useState(false)
	const [subscription, setSubscription] = useState<PushSubscription | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
		setSupported(true)

		navigator.serviceWorker
			.register("/sw.js", { scope: "/", updateViaCache: "none" })
			.then((reg) => reg.pushManager.getSubscription())
			.then((sub) => setSubscription(sub))
	}, [])

	async function subscribe() {
		setLoading(true)
		try {
			const reg = await navigator.serviceWorker.ready
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(
					process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
				),
			})
			setSubscription(sub)
			const json = sub.toJSON()
			if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
				throw new Error("Invalid subscription payload")
			}
			await subscribePush({
				endpoint: json.endpoint,
				keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
			})
			toast.success("Push notifications enabled")
		} catch {
			toast.error("Could not enable notifications")
		} finally {
			setLoading(false)
		}
	}

	async function unsubscribe() {
		if (!subscription) return
		setLoading(true)
		try {
			await unsubscribePush(subscription.endpoint)
			await subscription.unsubscribe()
			setSubscription(null)
			toast.success("Push notifications disabled")
		} catch {
			toast.error("Could not disable notifications")
		} finally {
			setLoading(false)
		}
	}

	if (!supported) return null

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2 text-sm">
				{subscription ? (
					<>
						<Bell className="text-primary size-4" />
						<span>Push notifications are enabled</span>
					</>
				) : (
					<>
						<BellOff className="text-muted-foreground size-4" />
						<span className="text-muted-foreground">Push notifications are disabled</span>
					</>
				)}
			</div>
			{subscription ? (
				<Button variant="outline" size="sm" onClick={unsubscribe} disabled={loading}>
					Disable
				</Button>
			) : (
				<Button size="sm" onClick={subscribe} disabled={loading}>
					Enable
				</Button>
			)}
		</div>
	)
}
