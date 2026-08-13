"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface AnimatedProgressBarProps {
	percentage: number
	className?: string
}

export function AnimatedProgressBar({ percentage, className }: AnimatedProgressBarProps) {
	const [width, setWidth] = useState(0)

	useEffect(() => {
		setWidth(Math.min(percentage, 100))
	}, [percentage])

	return (
		<div
			className={cn(
				"h-full rounded-none transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)]",
				className
			)}
			style={{ width: `${width}%` }}
		/>
	)
}
