import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
	title: string
	value: string
	icon: LucideIcon
	className?: string
}

export function StatCard({ title, value, icon: Icon, className }: StatCardProps) {
	return (
		<Card className={cn("relative", className)}>
			<CardContent className="flex items-center gap-4">
				<div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-none">
					<Icon className="text-muted-foreground size-5" />
				</div>
				<div className="flex flex-col gap-0.5">
					<p className="text-muted-foreground text-xs">{title}</p>
					<p className="text-lg font-semibold tracking-tight">{value}</p>
				</div>
			</CardContent>
		</Card>
	)
}
