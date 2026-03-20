"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { GoalForm } from "@/features/goals/components/goal-form"
import type { GoalWithProgress } from "@/features/goals/types/goals.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface GoalDialogProps {
	mode: FormMode
	goal?: GoalWithProgress
	groupId?: string
	trigger: ReactNode
}

export function GoalDialog({ mode, goal, groupId, trigger }: GoalDialogProps) {
	const t = useTranslations("goals.dialog")
	const defaultValues = goal
		? {
				id: goal.id,
				name: goal.name,
				description: goal.description,
				targetAmount: goal.targetAmount,
				targetDate: goal.targetDate?.toString(),
				groupId: goal.groupId,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? t("newTitle") : t("editTitle")}
			description={
				mode === FORM_MODE.CREATE
					? t("newDescription")
					: t("editDescription")
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<GoalForm
					mode={mode}
					defaultValues={defaultValues}
					groupId={groupId}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
