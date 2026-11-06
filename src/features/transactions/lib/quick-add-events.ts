/** Window event that asks the Quick Add drawer to open. */
export const QUICK_ADD_OPEN_EVENT = "quick-add:open"

export function openQuickAdd(): void {
	window.dispatchEvent(new Event(QUICK_ADD_OPEN_EVENT))
}
