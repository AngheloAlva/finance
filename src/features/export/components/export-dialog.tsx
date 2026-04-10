"use client"

import { useState, type ReactNode } from "react"
import { Download } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import type { TagOption } from "@/features/tags/types/tags.types"

interface ExportDialogProps {
	categories: CategoryWithChildren[]
	tags: TagOption[]
	trigger: ReactNode
}

export function ExportDialog({ categories, tags, trigger }: ExportDialogProps) {
	const t = useTranslations("export")
	const tt = useTranslations("transactions")
	const [open, setOpen] = useState(false)
	const [isExporting, setIsExporting] = useState(false)

	const rootCategories = categories.filter((c) => c.parentId === null)

	async function handleExport(formData: FormData) {
		setIsExporting(true)
		try {
			const params = new URLSearchParams()
			const dateFrom = formData.get("dateFrom") as string
			const dateTo = formData.get("dateTo") as string
			const type = formData.get("type") as string
			const categoryId = formData.get("categoryId") as string
			const tagId = formData.get("tagId") as string

			if (dateFrom) params.set("dateFrom", dateFrom)
			if (dateTo) params.set("dateTo", dateTo)
			if (type && type !== "ALL") params.set("type", type)
			if (categoryId && categoryId !== "ALL") params.set("categoryId", categoryId)
			if (tagId && tagId !== "ALL") params.set("tagId", tagId)

			const response = await fetch(`/api/export?${params.toString()}`)
			if (!response.ok) {
				toast.error(t("error"))
				return
			}

			const blob = await response.blob()
			const url = URL.createObjectURL(blob)
			const link = document.createElement("a")
			link.href = url
			link.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)

			toast.success(t("success"))
			setOpen(false)
		} catch {
			toast.error(t("error"))
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>

				<form action={handleExport} className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label className="text-xs">{tt("filter.from")}</Label>
							<DatePicker name="dateFrom" placeholder={tt("filter.from")} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label className="text-xs">{tt("filter.to")}</Label>
							<DatePicker name="dateTo" placeholder={tt("filter.to")} />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label className="text-xs">{tt("filter.type")}</Label>
						<Select
							name="type"
							defaultValue="ALL"
							items={[
								{ value: "ALL", label: tt("filter.all") },
								{ value: "INCOME", label: tt("types.income") },
								{ value: "EXPENSE", label: tt("types.expense") },
								{ value: "TRANSFER", label: tt("types.transfer") },
							]}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder={tt("filter.all")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">{tt("filter.all")}</SelectItem>
								<SelectItem value="INCOME">{tt("types.income")}</SelectItem>
								<SelectItem value="EXPENSE">{tt("types.expense")}</SelectItem>
								<SelectItem value="TRANSFER">{tt("types.transfer")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label className="text-xs">{tt("filter.category")}</Label>
						<Select
							name="categoryId"
							defaultValue="ALL"
							items={[
								{ value: "ALL", label: tt("filter.all") },
								...rootCategories.flatMap((cat) => [
									{ value: cat.id, label: cat.name },
									...cat.children.map((child) => ({
										value: child.id,
										label: child.name,
									})),
								]),
							]}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder={tt("filter.all")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">{tt("filter.all")}</SelectItem>
								{rootCategories.map((cat) => (
									<span key={cat.id}>
										<SelectItem value={cat.id}>{cat.name}</SelectItem>
										{cat.children.map((child) => (
											<SelectItem key={child.id} value={child.id}>
												<span className="pl-4">{child.name}</span>
											</SelectItem>
										))}
									</span>
								))}
							</SelectContent>
						</Select>
					</div>

					{tags.length > 0 && (
						<div className="flex flex-col gap-1.5">
							<Label className="text-xs">{tt("filter.tag")}</Label>
							<Select
								name="tagId"
								defaultValue="ALL"
								items={[
									{ value: "ALL", label: tt("filter.all") },
									...tags.map((tag) => ({ value: tag.id, label: tag.name })),
								]}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={tt("filter.all")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">{tt("filter.all")}</SelectItem>
									{tags.map((tag) => (
										<SelectItem key={tag.id} value={tag.id}>
											{tag.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<Button type="submit" disabled={isExporting} className="w-full gap-2">
						<Download className="size-3.5" />
						{isExporting ? t("exporting") : t("export")}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	)
}
