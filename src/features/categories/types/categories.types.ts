import type { Category } from "@/generated/prisma/client"

export interface CategoryWithChildren extends Category {
	children: Category[]
}
