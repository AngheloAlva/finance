import type { BudgetStatus } from "@/features/budgets/types/budgets.types"
import { AnimatedProgressBar } from "@/shared/components/animated-progress-bar"

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
	return (
		<div className="bg-muted h-2 w-full rounded-none">
			<AnimatedProgressBar percentage={percentage} className={STATUS_COLORS[status]} />
		</div>
	)
}
