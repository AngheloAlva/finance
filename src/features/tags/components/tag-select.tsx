"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TagOption } from "@/features/tags/types/tags.types"

interface TagSelectProps {
	tags: TagOption[]
	defaultValue?: string[]
}

export function TagSelect({ tags, defaultValue = [] }: TagSelectProps) {
	const t = useTranslations("tags")
	const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultValue))

	function toggle(tagId: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(tagId)) {
				next.delete(tagId)
			} else {
				next.add(tagId)
			}
			return next
		})
	}

	function remove(tagId: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			next.delete(tagId)
			return next
		})
	}

	const selectedTags = tags.filter((tag) => selected.has(tag.id))

	return (
		<div className="flex flex-col gap-1.5">
			{/* Hidden inputs for form submission */}
			{selectedTags.map((tag) => (
				<input key={tag.id} type="hidden" name="tagIds" value={tag.id} />
			))}

			<Popover>
				<PopoverTrigger
					render={
						<Button variant="outline" className="w-full justify-between font-normal">
							<span className="truncate text-xs">
								{selectedTags.length > 0
									? selectedTags.map((tag) => tag.name).join(", ")
									: t("selectTags")}
							</span>
							<ChevronDown className="size-3 opacity-50" />
						</Button>
					}
				/>
				<PopoverContent align="start" className="w-full max-h-48 overflow-y-auto p-1">
					{tags.length === 0 ? (
						<p className="text-muted-foreground px-2 py-1.5 text-xs">{t("noTags")}</p>
					) : (
						tags.map((tag) => (
							<button
								key={tag.id}
								type="button"
								className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs hover:bg-accent"
								onClick={() => toggle(tag.id)}
							>
								<Checkbox checked={selected.has(tag.id)} tabIndex={-1} />
								<span
									className="inline-block size-2 rounded-none"
									style={{ backgroundColor: tag.color }}
								/>
								<span>{tag.name}</span>
							</button>
						))
					)}
				</PopoverContent>
			</Popover>

			{selectedTags.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{selectedTags.map((tag) => (
						<span
							key={tag.id}
							className="inline-flex items-center gap-1 rounded-none border px-1.5 py-0.5 text-xs"
						>
							<span
								className="inline-block size-2 rounded-none"
								style={{ backgroundColor: tag.color }}
							/>
							{tag.name}
							<button type="button" onClick={() => remove(tag.id)} className="hover:text-destructive">
								<X className="size-3" />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	)
}
