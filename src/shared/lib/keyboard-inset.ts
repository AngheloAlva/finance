export interface VisualViewportLike {
	height: number
	offsetTop: number
}

/**
 * Height (px) of the layout viewport bottom that is hidden behind the on-screen
 * keyboard. `position: fixed; bottom: 0` elements anchor to the layout viewport,
 * so lifting them by this amount keeps them inside the visible area.
 */
export function getKeyboardInset(layoutHeight: number, viewport: VisualViewportLike): number {
	const visibleBottom = viewport.height + viewport.offsetTop
	return Math.max(0, Math.round(layoutHeight - visibleBottom))
}
