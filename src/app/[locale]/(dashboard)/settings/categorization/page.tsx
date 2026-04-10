import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { RuleDialog } from "@/features/categorization/components/rule-dialog"
import { RuleList } from "@/features/categorization/components/rule-list"
import { getUserRules } from "@/features/categorization/lib/categorization.queries"
import { getUserCategories } from "@/features/categories/lib/categories.queries"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { requireSession } from "@/shared/lib/auth"

export default async function CategorizationSettingsPage() {
	const session = await requireSession()
	const t = await getTranslations("categorization")

	const [rules, categories] = await Promise.all([
		getUserRules(session.user.id),
		getUserCategories(session.user.id),
	])

	const typedCategories = categories as CategoryWithChildren[]

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="mb-6 text-lg font-semibold">{t("title")}</h1>

			<Card>
				<CardHeader className="flex flex-row items-start justify-between">
					<div>
						<CardTitle>{t("rules")}</CardTitle>
						<CardDescription>{t("pageDescription")}</CardDescription>
					</div>
					<RuleDialog
						mode="create"
						categories={typedCategories}
						trigger={
							<Button size="sm">
								<Plus className="size-3.5" data-icon="inline-start" />
								{t("newRule")}
							</Button>
						}
					/>
				</CardHeader>
				<CardContent>
					<RuleList rules={rules} categories={typedCategories} />
				</CardContent>
			</Card>
		</div>
	)
}
