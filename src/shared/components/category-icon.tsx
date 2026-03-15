import { ICON_MAP } from "@/shared/lib/icons"
import { cn } from "@/lib/utils"

interface CategoryIconProps {
	icon: string
	color?: string
	className?: string
	size?: "sm" | "md"
}

export function CategoryIcon({ icon, color, className, size = "sm" }: CategoryIconProps) {
	const Icon = ICON_MAP[icon]
	const iconSize = size === "sm" ? "size-3.5" : "size-4"

	if (!Icon) {
		return (
			<span className={cn("size-2 rounded-none", className)} style={{ backgroundColor: color }} />
		)
	}

	return <Icon className={cn(iconSize, className)} style={{ color }} />
}
