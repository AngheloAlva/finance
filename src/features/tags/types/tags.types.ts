import type { Tag } from "@/generated/prisma/client"

export type TagWithCount = Tag & {
	_count: { transactions: number }
}

export type TagOption = Pick<Tag, "id" | "name" | "color">
