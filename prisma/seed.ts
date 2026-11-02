import "dotenv/config"

import {
	SYSTEM_CATEGORIES,
	systemCategoryId,
} from "@/features/categories/lib/system-categories"
import { CategoryScope } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"

async function seed() {
	console.log("Seeding system categories...")

	for (const category of SYSTEM_CATEGORIES) {
		const parentId = systemCategoryId(category.slug)

		await prisma.category.upsert({
			where: { id: parentId },
			update: {
				name: category.name.en,
				icon: category.icon,
				color: category.color,
				scope: CategoryScope.SYSTEM,
				transactionType: category.transactionType,
				isRecurring: category.isRecurring ?? false,
				isAvoidable: category.isAvoidable ?? false,
			},
			create: {
				id: parentId,
				name: category.name.en,
				icon: category.icon,
				color: category.color,
				scope: CategoryScope.SYSTEM,
				transactionType: category.transactionType,
				isRecurring: category.isRecurring ?? false,
				isAvoidable: category.isAvoidable ?? false,
			},
		})

		if (category.children) {
			for (const child of category.children) {
				const childId = systemCategoryId(child.slug)

				await prisma.category.upsert({
					where: { id: childId },
					update: {
						name: child.name.en,
						icon: child.icon,
						color: category.color,
						scope: CategoryScope.SYSTEM,
						transactionType: category.transactionType,
						isRecurring: child.isRecurring ?? category.isRecurring ?? false,
						isAvoidable: child.isAvoidable ?? false,
						parentId,
					},
					create: {
						id: childId,
						name: child.name.en,
						icon: child.icon,
						color: category.color,
						scope: CategoryScope.SYSTEM,
						transactionType: category.transactionType,
						isRecurring: child.isRecurring ?? category.isRecurring ?? false,
						isAvoidable: child.isAvoidable ?? false,
						parentId,
					},
				})
			}
		}
	}

	console.log("Seeding complete.")
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
