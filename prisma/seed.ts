import "dotenv/config"

import { CategoryScope, TransactionType } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"

function slugToId(slug: string): string {
	return `sys_cat_${slug}`
}

interface SeedCategory {
	slug: string
	name: string
	icon: string
	color: string
	transactionType: TransactionType
	isRecurring?: boolean
	isAvoidable?: boolean
	children?: Omit<SeedCategory, "color" | "transactionType" | "children">[]
}

const SYSTEM_CATEGORIES: SeedCategory[] = [
	// EXPENSE
	{
		slug: "food-dining",
		name: "Food & Dining",
		icon: "utensils",
		color: "#ef4444",
		transactionType: TransactionType.EXPENSE,
		children: [
			{ slug: "restaurants", name: "Restaurants", icon: "chef-hat" },
			{ slug: "groceries", name: "Groceries", icon: "shopping-cart" },
			{ slug: "coffee", name: "Coffee", icon: "coffee" },
		],
	},
	{
		slug: "transport",
		name: "Transport",
		icon: "car",
		color: "#f59e0b",
		transactionType: TransactionType.EXPENSE,
		children: [
			{ slug: "fuel", name: "Fuel", icon: "fuel" },
			{ slug: "public-transit", name: "Public Transit", icon: "train-front" },
			{
				slug: "taxi-rideshare",
				name: "Taxi & Rideshare",
				icon: "map-pin",
			},
		],
	},
	{
		slug: "housing",
		name: "Housing",
		icon: "home",
		color: "#8b5cf6",
		transactionType: TransactionType.EXPENSE,
		children: [
			{ slug: "rent", name: "Rent", icon: "key-round" },
			{ slug: "utilities", name: "Utilities", icon: "zap" },
			{ slug: "maintenance", name: "Maintenance", icon: "wrench" },
		],
	},
	{
		slug: "entertainment",
		name: "Entertainment",
		icon: "gamepad-2",
		color: "#ec4899",
		transactionType: TransactionType.EXPENSE,
	},
	{
		slug: "health",
		name: "Health",
		icon: "heart-pulse",
		color: "#10b981",
		transactionType: TransactionType.EXPENSE,
		children: [
			{ slug: "medical", name: "Medical", icon: "stethoscope" },
			{ slug: "pharmacy", name: "Pharmacy", icon: "pill" },
			{ slug: "gym", name: "Gym", icon: "dumbbell" },
		],
	},
	{
		slug: "education",
		name: "Education",
		icon: "graduation-cap",
		color: "#3b82f6",
		transactionType: TransactionType.EXPENSE,
	},
	{
		slug: "shopping",
		name: "Shopping",
		icon: "shopping-bag",
		color: "#f97316",
		transactionType: TransactionType.EXPENSE,
	},
	{
		slug: "subscriptions",
		name: "Subscriptions",
		icon: "repeat",
		color: "#6366f1",
		transactionType: TransactionType.EXPENSE,
		isRecurring: true,
	},
	{
		slug: "insurance",
		name: "Insurance",
		icon: "shield-check",
		color: "#14b8a6",
		transactionType: TransactionType.EXPENSE,
		isRecurring: true,
	},
	{
		slug: "personal-care",
		name: "Personal Care",
		icon: "sparkles",
		color: "#d946ef",
		transactionType: TransactionType.EXPENSE,
	},
	{
		slug: "gifts-donations",
		name: "Gifts & Donations",
		icon: "gift",
		color: "#f43f5e",
		transactionType: TransactionType.EXPENSE,
	},

	// INCOME
	{
		slug: "salary",
		name: "Salary",
		icon: "briefcase",
		color: "#22c55e",
		transactionType: TransactionType.INCOME,
		isRecurring: true,
	},
	{
		slug: "freelance",
		name: "Freelance",
		icon: "laptop",
		color: "#16a34a",
		transactionType: TransactionType.INCOME,
	},
	{
		slug: "investment-returns",
		name: "Investment Returns",
		icon: "trending-up",
		color: "#15803d",
		transactionType: TransactionType.INCOME,
	},
	{
		slug: "other-income",
		name: "Other Income",
		icon: "circle-dollar-sign",
		color: "#4ade80",
		transactionType: TransactionType.INCOME,
	},

	// TRANSFER
	{
		slug: "transfer",
		name: "Transfer",
		icon: "arrow-left-right",
		color: "#64748b",
		transactionType: TransactionType.TRANSFER,
	},
]

async function seed() {
	console.log("Seeding system categories...")

	for (const category of SYSTEM_CATEGORIES) {
		const parentId = slugToId(category.slug)

		await prisma.category.upsert({
			where: { id: parentId },
			update: {
				name: category.name,
				icon: category.icon,
				color: category.color,
				scope: CategoryScope.SYSTEM,
				transactionType: category.transactionType,
				isRecurring: category.isRecurring ?? false,
				isAvoidable: category.isAvoidable ?? false,
			},
			create: {
				id: parentId,
				name: category.name,
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
				const childId = slugToId(child.slug)

				await prisma.category.upsert({
					where: { id: childId },
					update: {
						name: child.name,
						icon: child.icon,
						color: category.color,
						scope: CategoryScope.SYSTEM,
						transactionType: category.transactionType,
						isRecurring: child.isRecurring ?? false,
						isAvoidable: child.isAvoidable ?? false,
						parentId,
					},
					create: {
						id: childId,
						name: child.name,
						icon: child.icon,
						color: category.color,
						scope: CategoryScope.SYSTEM,
						transactionType: category.transactionType,
						isRecurring: child.isRecurring ?? false,
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
