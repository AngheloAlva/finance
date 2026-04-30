"use client"

import { useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { QuickAddForm } from "@/features/transactions/components/quick-add-form"

interface QuickAddDrawerProps {
	categories: CategoryWithChildren[]
}

export function QuickAddDrawer({ categories }: QuickAddDrawerProps) {
	const t = useTranslations("transactions")
	const [open, setOpen] = useState(false)

	const handleSuccess = useCallback(() => {
		setOpen(false)
	}, [])

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<button
					aria-label={t("quickAdd.title")}
					className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-none bg-foreground text-background shadow-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Plus className="h-5 w-5" />
				</button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{t("quickAdd.title")}</DrawerTitle>
					<DrawerDescription>{t("quickAdd.description")}</DrawerDescription>
				</DrawerHeader>
				<QuickAddForm categories={categories} onSuccess={handleSuccess} />
			</DrawerContent>
		</Drawer>
	)
}
