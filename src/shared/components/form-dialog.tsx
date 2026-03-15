"use client"

import { useCallback, useState, type ReactNode } from "react"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"

interface FormDialogProps {
	trigger: ReactNode
	title: string
	description: string
	children: (onSuccess: () => void) => ReactNode
	className?: string
}

export function FormDialog({ trigger, title, description, children, className }: FormDialogProps) {
	const [open, setOpen] = useState(false)

	const handleSuccess = useCallback(() => {
		setOpen(false)
	}, [])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children(handleSuccess)}
			</DialogContent>
		</Dialog>
	)
}
