import { cn } from "@/lib/utils"

interface AlertCountBadgeProps {
	count: number
	className?: string
}

export function AlertCountBadge({ count, className }: AlertCountBadgeProps) {
	return (
		<span
			className={cn(
				"bg-destructive flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-semibold text-white tabular-nums",
				className,
			)}
		>
			{count > 99 ? "99+" : count}
		</span>
	)
}
