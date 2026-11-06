"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface AnimatedProgressBarProps {
	percentage: number
	className?: string
}

export function AnimatedProgressBar({ percentage, className }: AnimatedProgressBarProps) {
	const [width, setWidth] = useState(0)
	const targetWidth = Math.min(percentage, 100)

	useEffect(() => {
		let secondFrame = 0
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => setWidth(targetWidth))
		})

		return () => {
			cancelAnimationFrame(firstFrame)
			cancelAnimationFrame(secondFrame)
		}
	}, [targetWidth])

	return (
		<>
			<div
				className={cn(
					"h-full rounded-full transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] motion-reduce:hidden",
					className
				)}
				style={{ width: `${width}%` }}
			/>
			<div
				className={cn("hidden h-full rounded-full motion-reduce:block", className)}
				style={{ width: `${targetWidth}%` }}
			/>
		</>
	)
}
