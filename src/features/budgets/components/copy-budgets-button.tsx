"use client"

import { useActionState, useEffect } from "react"
import { Copy } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { copyBudgetsAction } from "@/features/budgets/actions/copy-budgets.action"

interface CopyBudgetsButtonProps {
	month: number
	year: number
}

const INITIAL_STATE = { success: false, error: "" } as const

export function CopyBudgetsButton({ month, year }: CopyBudgetsButtonProps) {
	const t = useTranslations("budgets")
	const tErrors = useTranslations("errors")
	const [state, action, isPending] = useActionState(copyBudgetsAction, INITIAL_STATE)

	useEffect(() => {
		if (state.success) {
			toast.success(t("copySuccess", { count: state.data }))
		}
		if (!state.success && state.error) {
			toast.error(tErrors(state.error as Parameters<typeof tErrors>[0]))
		}
	}, [state, t, tErrors])

	function handleCopy() {
		const formData = new FormData()
		formData.set("month", String(month))
		formData.set("year", String(year))
		action(formData)
	}

	return (
		<Button variant="outline" size="sm" onClick={handleCopy} disabled={isPending} className="gap-1.5">
			<Copy className="size-3" />
			{t("copyFromLastMonth")}
		</Button>
	)
}
