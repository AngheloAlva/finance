self.addEventListener("push", function (event) {
	if (!event.data) return

	const data = event.data.json()
	const options = {
		body: data.body,
		icon: data.icon || "/icon-192x192.png",
		badge: "/icon-192x192.png",
		vibrate: [100, 50, 100],
		data: { url: data.url || "/" },
	}

	event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", function (event) {
	event.notification.close()
	event.waitUntil(
		clients.matchAll({ type: "window" }).then((clientList) => {
			const target = event.notification.data?.url || "/"
			for (const client of clientList) {
				const path = new URL(client.url).pathname
				if (path === target && "focus" in client) {
					client.navigate?.(target)
					return client.focus()
				}
			}
			if (clients.openWindow) return clients.openWindow(target)
		})
	)
})
