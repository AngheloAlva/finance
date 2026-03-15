"use client"

import { Info } from "lucide-react"

interface SimulationEmptyStateProps {
	title: string
	description: string
}

export function SimulationEmptyState({ title, description }: SimulationEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-none border border-dashed p-8 text-center">
			<div className="bg-muted flex size-10 items-center justify-center rounded-none">
				<Info className="text-muted-foreground size-5" />
			</div>
			<div className="space-y-1">
				<p className="text-sm font-medium">{title}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
		</div>
	)
}
