"use client"

import { Check, Sparkles, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { CategorySuggestion as CategorySuggestionType } from "@/features/categorization/types/categorization.types"

interface CategorySuggestionProps {
	suggestion: CategorySuggestionType
	onAccept: (categoryId: string) => void
	onDismiss: () => void
}

export function CategorySuggestion({ suggestion, onAccept, onDismiss }: CategorySuggestionProps) {
	const t = useTranslations("categorization")

	return (
		<div className="flex items-center justify-between gap-2 rounded-none border border-primary/40 bg-primary/5 px-3 py-2 text-xs">
			<div className="flex items-center gap-2">
				<Sparkles className="size-3 text-primary" />
				<span className="text-muted-foreground">{t("suggestionLabel")}</span>
				<span
					className="inline-block size-2 rounded-none"
					style={{ backgroundColor: suggestion.categoryColor }}
				/>
				<span className="font-medium">{suggestion.categoryName}</span>
				<span className="text-muted-foreground">?</span>
			</div>
			<div className="flex items-center gap-1">
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={() => onAccept(suggestion.categoryId)}
					title={t("accept")}
				>
					<Check className="size-3" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onDismiss}
					title={t("dismiss")}
				>
					<X className="size-3" />
				</Button>
			</div>
		</div>
	)
}
