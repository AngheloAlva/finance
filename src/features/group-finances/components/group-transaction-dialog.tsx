"use client"

import { useCallback, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { GroupTransactionForm } from "@/features/group-finances/components/group-transaction-form"
import type { SplitMember } from "@/features/group-finances/lib/split.utils"
import type { CurrencyCode } from "@/shared/lib/constants"

interface GroupTransactionDialogProps {
	groupId: string
	members: SplitMember[]
	categories: CategoryWithChildren[]
	currency: CurrencyCode
	trigger: ReactNode
}

export function GroupTransactionDialog({
	groupId,
	members,
	categories,
	currency,
	trigger,
}: GroupTransactionDialogProps) {
	const [open, setOpen] = useState(false)
	const t = useTranslations("groupFinances.dialog")

	const handleSuccess = useCallback(() => {
		setOpen(false)
	}, [])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{t("description")}
					</DialogDescription>
				</DialogHeader>
				<GroupTransactionForm
					groupId={groupId}
					members={members}
					categories={categories}
					currency={currency}
					onSuccess={handleSuccess}
				/>
			</DialogContent>
		</Dialog>
	)
}
