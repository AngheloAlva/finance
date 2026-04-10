"use client"

import { useActionState, useEffect, useState, type ReactNode } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTagAction } from "@/features/tags/actions/create-tag.action"
import { deleteTagAction } from "@/features/tags/actions/delete-tag.action"
import { updateTagAction } from "@/features/tags/actions/update-tag.action"
import type { TagWithCount } from "@/features/tags/types/tags.types"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface TagManagerDialogProps {
	tags: TagWithCount[]
	trigger: ReactNode
}

const DEFAULT_COLORS = [
	"#6b7280", "#ef4444", "#f97316", "#eab308", "#22c55e",
	"#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e",
] as const

export function TagManagerDialog({ tags, trigger }: TagManagerDialogProps) {
	const t = useTranslations("tags")
	const tErrors = useTranslations("errors")
	const [open, setOpen] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)

	const [createState, createAction, isCreating] = useActionState(createTagAction, INITIAL_VOID_STATE)
	const [updateState, updateAction, isUpdating] = useActionState(updateTagAction, INITIAL_VOID_STATE)
	const [deleteState, deleteAction, isDeleting] = useActionState(deleteTagAction, INITIAL_VOID_STATE)

	useEffect(() => {
		if (createState.success) {
			toast.success(t("createdSuccess"))
		}
		if (!createState.success && createState.error) {
			toast.error(tErrors(createState.error as Parameters<typeof tErrors>[0]))
		}
	}, [createState, t, tErrors])

	useEffect(() => {
		if (updateState.success) {
			toast.success(t("updatedSuccess"))
			setEditingId(null)
		}
		if (!updateState.success && updateState.error) {
			toast.error(tErrors(updateState.error as Parameters<typeof tErrors>[0]))
		}
	}, [updateState, t, tErrors])

	useEffect(() => {
		if (deleteState.success) toast.success(t("deletedSuccess"))
	}, [deleteState, t])

	function handleDelete(id: string) {
		const formData = new FormData()
		formData.set("id", id)
		deleteAction(formData)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("manage")}</DialogTitle>
					<DialogDescription>{t("manageDescription")}</DialogDescription>
				</DialogHeader>

				{/* Create form */}
				<form action={createAction} className="flex items-end gap-2">
					<div className="flex flex-1 flex-col gap-1">
						<Label className="text-xs">{t("name")}</Label>
						<Input name="name" placeholder={t("namePlaceholder")} required className="h-8 text-xs" />
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">{t("color")}</Label>
						<Input name="color" type="color" defaultValue="#6b7280" className="h-8 w-12 p-0.5" />
					</div>
					<Button type="submit" size="sm" disabled={isCreating}>
						<Plus className="size-3" />
					</Button>
				</form>

				{/* Tag list */}
				<div className="flex flex-col gap-1">
					{tags.length === 0 && (
						<p className="text-muted-foreground py-4 text-center text-xs">{t("noTags")}</p>
					)}
					{tags.map((tag) => (
						<div key={tag.id} className="flex items-center justify-between rounded-none border px-3 py-2">
							{editingId === tag.id ? (
								<form action={updateAction} className="flex flex-1 items-center gap-2">
									<input type="hidden" name="id" value={tag.id} />
									<Input
										name="name"
										defaultValue={tag.name}
										className="h-7 flex-1 text-xs"
										autoFocus
									/>
									<Input
										name="color"
										type="color"
										defaultValue={tag.color}
										className="h-7 w-10 p-0.5"
									/>
									<Button type="submit" size="icon-xs" disabled={isUpdating}>
										<Plus className="size-3" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										onClick={() => setEditingId(null)}
									>
										<X className="size-3" />
									</Button>
								</form>
							) : (
								<>
									<div className="flex items-center gap-2">
										<span
											className="inline-block size-3 rounded-none"
											style={{ backgroundColor: tag.color }}
										/>
										<span className="text-xs font-medium">{tag.name}</span>
										<span className="text-muted-foreground text-xs">
											({tag._count.transactions})
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => setEditingId(tag.id)}
										>
											<Pencil className="size-3" />
										</Button>
										<ConfirmDialog
											trigger={
												<Button variant="ghost" size="icon-xs" disabled={isDeleting}>
													<Trash2 className="size-3" />
												</Button>
											}
											title={t("deleteConfirmTitle")}
											description={t("deleteConfirmDescription", { name: tag.name })}
											onConfirm={() => handleDelete(tag.id)}
											destructive
											loading={isDeleting}
										/>
									</div>
								</>
							)}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
