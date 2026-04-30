"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { suggestCategoryAction } from "@/features/categorization/actions/suggest-category.action"
import type { CategorySuggestion } from "@/features/categorization/types/categorization.types"

interface UseCategorySuggestionOptions {
	description: string
	categoryId: string
	enabled?: boolean
	debounceMs?: number
}

interface UseCategorySuggestionResult {
	suggestion: CategorySuggestion | null
	accept: (selectedId: string, onAccept: (id: string) => void) => void
	dismiss: () => void
}

export function useCategorySuggestion({
	description,
	categoryId,
	enabled = true,
	debounceMs = 500,
}: UseCategorySuggestionOptions): UseCategorySuggestionResult {
	const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null)
	const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(() => new Set())
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (!enabled) return
		const trimmed = description.trim().toLowerCase()
		if (trimmed.length < 2 || dismissedPatterns.has(trimmed)) {
			setSuggestion(null)
			return
		}

		if (timeoutRef.current) clearTimeout(timeoutRef.current)
		timeoutRef.current = setTimeout(async () => {
			try {
				const result = await suggestCategoryAction(description)
				setSuggestion(result && result.categoryId !== categoryId ? result : null)
			} catch {
				setSuggestion(null)
			}
		}, debounceMs)

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
		}
	}, [description, categoryId, dismissedPatterns, enabled, debounceMs])

	const accept = useCallback(
		(selectedId: string, onAccept: (id: string) => void) => {
			onAccept(selectedId)
			setSuggestion(null)
		},
		[],
	)

	const dismiss = useCallback(() => {
		const trimmed = description.trim().toLowerCase()
		if (trimmed) {
			setDismissedPatterns((prev) => new Set(prev).add(trimmed))
		}
		setSuggestion(null)
	}, [description])

	return { suggestion, accept, dismiss }
}
