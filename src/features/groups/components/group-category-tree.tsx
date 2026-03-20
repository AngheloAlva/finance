import type { GroupRole } from "@/generated/prisma/enums"
import { getTranslations } from "next-intl/server"

import { CategoryTreeItem } from "@/features/categories/components/category-tree-item"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { canManageCategories } from "@/features/groups/lib/groups.permissions"

interface GroupCategoryTreeProps {
	groupId: string
	categories: CategoryWithChildren[]
	currentUserRole: GroupRole
}

export async function GroupCategoryTree({
	groupId,
	categories,
	currentUserRole,
}: GroupCategoryTreeProps) {
	const t = await getTranslations("groups.categories")
	const rootCategories = categories.filter((c) => c.parentId === null)
	const canEdit = canManageCategories(currentUserRole)

	if (rootCategories.length === 0) {
		return (
			<p className="text-muted-foreground py-8 text-center text-xs">
				{t("noCategories")} {canEdit && t("createFirstCategory")}
			</p>
		)
	}

	return (
		<div className="flex flex-col gap-1">
			{rootCategories.map((category) => (
				<CategoryTreeItem
					key={category.id}
					category={category}
					allCategories={categories}
					groupId={groupId}
					canEdit={canEdit}
				/>
			))}
		</div>
	)
}
