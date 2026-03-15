"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDateForInput(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

function parseDateString(value: string | undefined): Date | undefined {
	if (!value) return undefined
	const [year, month, day] = value.split("-").map(Number)
	if (!year || !month || !day) return undefined
	return new Date(year, month - 1, day)
}

interface DatePickerProps {
	name?: string
	id?: string
	defaultValue?: string
	value?: string
	onChange?: (value: string) => void
	required?: boolean
	className?: string
	placeholder?: string
}

function DatePicker({
	name,
	id,
	defaultValue,
	value: controlledValue,
	onChange,
	required,
	className,
	placeholder = "Pick a date",
}: DatePickerProps) {
	const [open, setOpen] = useState(false)
	const [internalDate, setInternalDate] = useState<Date | undefined>(() =>
		parseDateString(controlledValue ?? defaultValue)
	)

	const isControlled = controlledValue !== undefined
	const selectedDate = isControlled ? parseDateString(controlledValue) : internalDate
	const displayValue = selectedDate
		? selectedDate.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: null

	function handleSelect(date: Date | undefined) {
		if (!date) return
		if (!isControlled) {
			setInternalDate(date)
		}
		onChange?.(formatDateForInput(date))
		setOpen(false)
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							id={id}
							type="button"
							variant="outline"
							className={cn(
								"w-full justify-start text-left font-normal",
								!displayValue && "text-muted-foreground",
								className
							)}
						/>
					}
				>
					<CalendarIcon className="mr-2 size-4" />
					{displayValue ?? <span>{placeholder}</span>}
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={handleSelect}
						defaultMonth={selectedDate}
					/>
				</PopoverContent>
			</Popover>
			{name && (
				<input
					type="hidden"
					name={name}
					value={selectedDate ? formatDateForInput(selectedDate) : ""}
					required={required}
				/>
			)}
		</>
	)
}

export { DatePicker }
