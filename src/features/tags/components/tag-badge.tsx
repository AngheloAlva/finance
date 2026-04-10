import { cn } from "@/lib/utils"

interface TagBadgeProps {
	name: string
	color: string
	className?: string
}

export function TagBadge({ name, color, className }: TagBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-none border px-1.5 py-0.5 text-xs",
				className,
			)}
		>
			<span
				className="inline-block size-2 rounded-none"
				style={{ backgroundColor: color }}
			/>
			{name}
		</span>
	)
}
