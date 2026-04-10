"use client"

import { useActionState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteRuleAction } from "@/features/categorization/actions/delete-rule.action"
import { RuleDialog } from "@/features/categorization/components/rule-dialog"
import {
	MATCH_TYPE_KEYS,
	type CategorizationRuleWithCategory,
} from "@/features/categorization/types/categorization.types"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface RuleListProps {
	rules: CategorizationRuleWithCategory[]
	categories: CategoryWithChildren[]
}

export function RuleList({ rules, categories }: RuleListProps) {
	const t = useTranslations("categorization")
	const [deleteState, deleteAction, isDeleting] = useActionState(deleteRuleAction, INITIAL_VOID_STATE)

	useEffect(() => {
		if (deleteState.success) toast.success(t("deletedSuccess"))
	}, [deleteState, t])

	function handleDelete(id: string) {
		const formData = new FormData()
		formData.set("id", id)
		deleteAction(formData)
	}

	if (rules.length === 0) {
		return (
			<div className="text-muted-foreground rounded-none border py-8 text-center text-sm">
				{t("noRules")}
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{rules.map((rule) => (
				<div
					key={rule.id}
					className="flex items-center justify-between rounded-none border p-3"
				>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-mono text-xs">{rule.pattern}</span>
							<Badge variant="outline">
								{t(`matchTypes.${MATCH_TYPE_KEYS[rule.matchType]}` as Parameters<typeof t>[0])}
							</Badge>
							{rule.hitCount > 0 && (
								<span className="text-muted-foreground text-xs">
									{t("hitCount", { count: rule.hitCount })}
								</span>
							)}
						</div>
						<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<span
								className="inline-block size-2 rounded-none"
								style={{ backgroundColor: rule.category.color }}
							/>
							<span>{rule.category.name}</span>
						</div>
					</div>

					<div className="flex items-center gap-1">
						<RuleDialog
							mode="edit"
							rule={rule}
							categories={categories}
							trigger={
								<Button variant="ghost" size="icon-xs">
									<Pencil className="size-3" />
								</Button>
							}
						/>
						<ConfirmDialog
							trigger={
								<Button variant="ghost" size="icon-xs" disabled={isDeleting}>
									<Trash2 className="size-3" />
								</Button>
							}
							title={t("deleteConfirmTitle")}
							description={t("deleteConfirmDescription", { pattern: rule.pattern })}
							onConfirm={() => handleDelete(rule.id)}
							destructive
							loading={isDeleting}
						/>
					</div>
				</div>
			))}
		</div>
	)
}
