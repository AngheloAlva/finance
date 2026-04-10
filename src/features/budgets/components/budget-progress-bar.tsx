import { cn } from "@/lib/utils"
import type { BudgetStatus } from "@/features/budgets/types/budgets.types"

const STATUS_COLORS = {
	ok: "bg-emerald-500",
	warning: "bg-amber-500",
	exceeded: "bg-red-500",
} as const

interface BudgetProgressBarProps {
	percentage: number
	status: BudgetStatus
}

export function BudgetProgressBar({ percentage, status }: BudgetProgressBarProps) {
	const clampedWidth = Math.min(percentage, 100)

	return (
		<div className="h-2 w-full rounded-none bg-muted">
			<div
				className={cn("h-full rounded-none transition-all", STATUS_COLORS[status])}
				style={{ width: `${clampedWidth}%` }}
			/>
		</div>
	)
}
