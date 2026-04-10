"use client"

import { Bell } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { SuggestionCard } from "@/features/recurring/components/suggestion-card"
import type { RecurringTemplateWithRule } from "@/features/recurring/types/recurring.types"
import type { CurrencyCode } from "@/shared/lib/constants"

interface SuggestionDrawerProps {
	suggestions: RecurringTemplateWithRule[]
	currency: CurrencyCode
}

export function SuggestionDrawer({ suggestions, currency }: SuggestionDrawerProps) {
	const t = useTranslations("recurring.suggestions")
	const count = suggestions.length

	if (count === 0) return null

	return (
		<Sheet>
			<SheetTrigger
				render={
					<Button variant="outline" size="sm" className="relative gap-2">
						<Bell className="size-4" />
						{t("title")}
						<Badge variant="default" className="ml-1">
							{count}
						</Badge>
					</Button>
				}
			/>
			<SheetContent side="right" className="flex flex-col overflow-hidden">
				<SheetHeader>
					<SheetTitle>{t("title")}</SheetTitle>
					<SheetDescription>{t("description")}</SheetDescription>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto">
					{suggestions.map((suggestion) => (
						<SuggestionCard
							key={suggestion.id}
							template={suggestion}
							currency={currency}
						/>
					))}
				</div>
			</SheetContent>
		</Sheet>
	)
}
