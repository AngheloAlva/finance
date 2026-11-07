"use client"

import { useCallback, useEffect, useState } from "react"
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
import { QUICK_ADD_OPEN_EVENT } from "@/features/transactions/lib/quick-add-events"

interface QuickAddDrawerProps {
	categories: CategoryWithChildren[]
}

export function QuickAddDrawer({ categories }: QuickAddDrawerProps) {
	const t = useTranslations("transactions")
	const [open, setOpen] = useState(false)

	const handleSuccess = useCallback(() => {
		setOpen(false)
	}, [])

	useEffect(() => {
		const handleOpen = () => setOpen(true)
		window.addEventListener(QUICK_ADD_OPEN_EVENT, handleOpen)
		return () => window.removeEventListener(QUICK_ADD_OPEN_EVENT, handleOpen)
	}, [])

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<button
					aria-label={t("quickAdd.title")}
					className="animate-in fade-in-0 zoom-in-95 bg-primary text-primary-foreground focus-visible:ring-ring fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-[opacity,scale] duration-[var(--duration-fast)] hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none active:scale-95 md:right-6 md:bottom-6 md:left-auto md:translate-x-0"
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
