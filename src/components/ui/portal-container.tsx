"use client"

import * as React from "react"

const PortalContainerContext = React.createContext<HTMLElement | null>(null)

/**
 * Popups rendered inside a modal surface must portal into it: outside, they
 * paint behind the surface and its focus trap blocks them.
 */
export const PortalContainerProvider = PortalContainerContext.Provider

export function usePortalContainer() {
	return React.useContext(PortalContainerContext) ?? undefined
}
