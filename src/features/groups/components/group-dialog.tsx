"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { GroupForm } from "@/features/groups/components/group-form"
import type { GroupWithMemberCount } from "@/features/groups/types/groups.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface GroupDialogProps {
	mode: FormMode
	group?: GroupWithMemberCount
	trigger: ReactNode
}

export function GroupDialog({ mode, group, trigger }: GroupDialogProps) {
	const t = useTranslations("groups.dialog")
	const defaultValues = group
		? {
				id: group.id,
				name: group.name,
				description: group.description,
				currency: group.currency,
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
				<GroupForm mode={mode} defaultValues={defaultValues} onSuccess={onSuccess} />
			)}
		</FormDialog>
	)
}
