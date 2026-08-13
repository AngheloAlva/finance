"use client"

import { useEffect, useRef, useState } from "react"

import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

interface AnimatedNumberProps {
	valueCents: number
	currency: CurrencyCode
	locale?: string
	durationMs?: number
}

export function AnimatedNumber({
	valueCents,
	currency,
	locale,
	durationMs = 600,
}: AnimatedNumberProps) {
	const [displayedValue, setDisplayedValue] = useState(0)
	const renderedValueRef = useRef(0)

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || durationMs <= 0) {
			const animationFrame = requestAnimationFrame(() => {
				renderedValueRef.current = valueCents
				setDisplayedValue(valueCents)
			})
			return () => cancelAnimationFrame(animationFrame)
		}

		const startValue = renderedValueRef.current
		const difference = valueCents - startValue
		const startedAt = performance.now()
		let animationFrame = 0

		const animate = (now: number) => {
			const progress = Math.min((now - startedAt) / durationMs, 1)
			const easedProgress = 1 - Math.pow(1 - progress, 3)
			const currentValue = startValue + difference * easedProgress

			renderedValueRef.current = currentValue
			setDisplayedValue(Math.round(currentValue))

			if (progress < 1) {
				animationFrame = requestAnimationFrame(animate)
			}
		}

		animationFrame = requestAnimationFrame(animate)
		return () => cancelAnimationFrame(animationFrame)
	}, [durationMs, valueCents])

	return <span className="tabular-nums">{formatCurrency(displayedValue, currency, locale)}</span>
}
