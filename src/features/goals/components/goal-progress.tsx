import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { cn } from "@/lib/utils"

interface GoalProgressProps {
	currentAmount: number
	targetAmount: number
	percentage: number
	currency: CurrencyCode
	compact?: boolean
	locale?: string
}

export function GoalProgress({
	currentAmount,
	targetAmount,
	percentage,
	currency,
	compact = false,
	locale,
}: GoalProgressProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="bg-muted h-2 w-full overflow-hidden rounded-none">
				<div
					className={cn(
						"h-full rounded-none transition-all",
						percentage >= 100
							? "bg-emerald-500"
							: percentage >= 75
								? "bg-blue-500"
								: percentage >= 50
									? "bg-amber-500"
									: "bg-primary"
					)}
					style={{ width: `${Math.min(percentage, 100)}%` }}
				/>
			</div>
			<div
				className={cn(
					"text-muted-foreground flex items-center justify-between",
					compact ? "text-[10px]" : "text-xs"
				)}
			>
				<span>{percentage}%</span>
				<span>
					{formatCurrency(currentAmount, currency, locale)} / {formatCurrency(targetAmount, currency, locale)}
				</span>
			</div>
		</div>
	)
}
