"use client"

import { ChevronRight, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CategoryDialog } from "@/features/categories/components/category-dialog"
import { DeleteCategoryButton } from "@/features/categories/components/delete-category-button"
import { DeleteGroupCategoryButton } from "@/features/groups/components/delete-group-category-button"
import { CategoryScope } from "@/generated/prisma/enums"
import { ICON_MAP } from "@/shared/lib/icons"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { cn } from "@/lib/utils"

interface CategoryTreeItemProps {
	category: CategoryWithChildren
	allCategories: CategoryWithChildren[]
	depth?: number
	groupId?: string
	canEdit?: boolean
}

export function CategoryTreeItem({
	category,
	allCategories,
	depth = 0,
	groupId,
	canEdit,
}: CategoryTreeItemProps) {
	const hasChildren = category.children.length > 0
	const isGroupScope = category.scope === CategoryScope.GROUP
	const isUserScope = category.scope === CategoryScope.USER
	const showActions = isGroupScope ? (canEdit ?? false) : isUserScope
	const Icon = ICON_MAP[category.icon]

	const content = (
		<div
			className={cn(
				"group hover:bg-muted flex items-center gap-2 rounded-none px-2 py-1.5 text-xs",
				depth > 0 && "ml-6"
			)}
		>
			{hasChildren && (
				<CollapsibleTrigger
					render={
						<button
							type="button"
							className="text-muted-foreground flex size-4 items-center justify-center transition-transform data-[panel-open]:rotate-90"
						/>
					}
				>
					<ChevronRight className="size-3" />
				</CollapsibleTrigger>
			)}

			{!hasChildren && <span className="size-4" />}

			<span
				className="flex size-5 items-center justify-center rounded-none"
				style={{ color: category.color }}
			>
				{Icon ? (
					<Icon className="size-3.5" />
				) : (
					<span className="size-2 rounded-none" style={{ backgroundColor: category.color }} />
				)}
			</span>

			<span className="flex-1 font-medium">{category.name}</span>

			<div className="flex items-center gap-1">
				<Badge variant="outline" className="text-[10px]">
					{category.transactionType}
				</Badge>

				{category.scope === CategoryScope.SYSTEM && (
					<Badge variant="secondary" className="text-[10px]">
						System
					</Badge>
				)}

				{category.isRecurring && (
					<Badge variant="secondary" className="text-[10px]">
						Recurring
					</Badge>
				)}

				{category.isAvoidable && (
					<Badge variant="secondary" className="text-[10px]">
						Avoidable
					</Badge>
				)}
			</div>

			{showActions && (
				<div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					<CategoryDialog
						mode="edit"
						category={category}
						categories={allCategories}
						groupId={groupId}
						trigger={
							<Button variant="ghost" size="icon-xs">
								<Pencil className="size-3" />
							</Button>
						}
					/>
					{isGroupScope && groupId ? (
						<DeleteGroupCategoryButton
							categoryId={category.id}
							categoryName={category.name}
							groupId={groupId}
						/>
					) : (
						<DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
					)}
				</div>
			)}
		</div>
	)

	if (!hasChildren) {
		return content
	}

	return (
		<Collapsible>
			{content}
			<CollapsibleContent>
				{category.children.map((child) => {
					const childWithChildren: CategoryWithChildren = {
						...child,
						children: [],
					}
					return (
						<CategoryTreeItem
							key={child.id}
							category={childWithChildren}
							allCategories={allCategories}
							depth={depth + 1}
							groupId={groupId}
							canEdit={canEdit}
						/>
					)
				})}
			</CollapsibleContent>
		</Collapsible>
	)
}
