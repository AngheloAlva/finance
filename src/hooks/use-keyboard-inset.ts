import * as React from "react"

import { getKeyboardInset } from "@/shared/lib/keyboard-inset"

const INSET_VAR = "--keyboard-inset"
const VIEWPORT_HEIGHT_VAR = "--visual-viewport-height"

/**
 * Publishes the on-screen keyboard height as CSS variables on <html> so fixed,
 * bottom-anchored surfaces (drawers) can stay above the keyboard:
 *   --keyboard-inset: covered height in px (0 when the keyboard is closed)
 *   --visual-viewport-height: visible viewport height in px
 *
 * Replaces vaul's `repositionInputs`, which misplaces drawers in iOS 26
 * standalone PWAs. When the keyboard opens, the focused field inside
 * `container` is scrolled into view within the drawer.
 */
export function useKeyboardInset(container: HTMLElement | null) {
	React.useEffect(() => {
		const viewport = window.visualViewport
		if (!viewport) return

		const root = document.documentElement
		let frame = 0

		const update = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const inset = getKeyboardInset(window.innerHeight, viewport)
				root.style.setProperty(INSET_VAR, `${inset}px`)
				root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${Math.round(viewport.height)}px`)

				const focused = document.activeElement
				if (inset > 0 && focused instanceof HTMLElement && container?.contains(focused)) {
					focused.scrollIntoView({ block: "nearest" })
				}
			})
		}

		update()
		viewport.addEventListener("resize", update)
		viewport.addEventListener("scroll", update)

		return () => {
			cancelAnimationFrame(frame)
			viewport.removeEventListener("resize", update)
			viewport.removeEventListener("scroll", update)
			root.style.removeProperty(INSET_VAR)
			root.style.removeProperty(VIEWPORT_HEIGHT_VAR)
		}
	}, [container])
}
