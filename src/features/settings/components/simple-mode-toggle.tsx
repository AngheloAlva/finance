"use client"

import { useOptimistic, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateSimpleModeAction } from "@/features/settings/actions/update-simple-mode.action"

interface SimpleModeToggleProps {
	simpleMode: boolean
}

/** "Show all sections" switch: on means simple mode is off. */
export function SimpleModeToggle({ simpleMode }: SimpleModeToggleProps) {
	const t = useTranslations("settings.sections")
	const tErrors = useTranslations("errors")
	const [isPending, startTransition] = useTransition()
	const [showAll, setShowAll] = useOptimistic(!simpleMode)

	function handleChange(checked: boolean) {
		startTransition(async () => {
			setShowAll(checked)
			const result = await updateSimpleModeAction(!checked)
			if (result.success) {
				toast.success(checked ? t("showAllOn") : t("showAllOff"))
			} else {
				toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]))
			}
		})
	}

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex flex-col gap-1">
				<Label htmlFor="show-all-sections">{t("showAll")}</Label>
				<p className="text-muted-foreground text-xs">{t("showAllDescription")}</p>
			</div>
			<Switch
				id="show-all-sections"
				checked={showAll}
				onCheckedChange={handleChange}
				disabled={isPending}
			/>
		</div>
	)
}
