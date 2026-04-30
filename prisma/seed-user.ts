import "dotenv/config"

import {
	AlertSeverity,
	AlertStatus,
	AlertType,
	GoalStatus,
	InvestmentType,
	PaymentMethod,
	RecurrenceFrequency,
	TransactionType,
} from "@/generated/prisma/enums"
import { auth } from "@/features/auth/lib/auth.config"
import { prisma } from "@/shared/lib/prisma"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a dollar amount to cents (integer). */
function dollars(n: number): number {
	return Math.round(n * 100)
}

/** Random integer between min and max (inclusive). */
function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Random float between min and max, rounded to 2 decimals. */
function randFloat(min: number, max: number): number {
	return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

/** Generate a random date within a given month (1-indexed). */
function randomDateInMonth(year: number, month: number): Date {
	const daysInMonth = new Date(year, month, 0).getDate()
	const day = randInt(1, daysInMonth)
	return new Date(year, month - 1, day, randInt(8, 22), randInt(0, 59))
}

/** Deterministic date — specific day in a month. */
function dateOn(year: number, month: number, day: number): Date {
	return new Date(year, month - 1, day, 10, 0, 0)
}

/**
 * Given a purchase date and a credit card's closing/payment days,
 * compute the impactDate (the payment cycle date when this charge hits).
 */
function creditCardImpactDate(
	purchaseDate: Date,
	closingDay: number,
	paymentDay: number,
): Date {
	const year = purchaseDate.getFullYear()
	const month = purchaseDate.getMonth() // 0-indexed
	const day = purchaseDate.getDate()

	// If purchase is before the closing day, it goes to THIS cycle's payment
	// Otherwise it goes to NEXT cycle's payment
	if (day <= closingDay) {
		// Payment is in the same month (or next if paymentDay < closingDay)
		if (paymentDay > closingDay) {
			return new Date(year, month, paymentDay)
		}
		return new Date(year, month + 1, paymentDay)
	}
	// Purchase after closing — goes to next cycle
	if (paymentDay > closingDay) {
		return new Date(year, month + 1, paymentDay)
	}
	return new Date(year, month + 2, paymentDay)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_USER = {
	email: "test@test.com",
	password: "test1234",
	name: "Test User",
}

// Deterministic IDs for cross-referencing
const CC_VISA_ID = "seed_cc_visa_4532"
const CC_MC_ID = "seed_cc_mc_8901"
const CC_AMEX_ID = "seed_cc_amex_3456"

const GOAL_EMERGENCY_ID = "seed_goal_emergency_fund"
const GOAL_VACATION_ID = "seed_goal_vacation_japan"
const GOAL_CAR_ID = "seed_goal_new_car"

const INV_SP500_ID = "seed_inv_sp500"
const INV_APPLE_ID = "seed_inv_apple"
const INV_BTC_ID = "seed_inv_bitcoin"
const INV_SAVINGS_ID = "seed_inv_savings"

const TMPL_SALARY_ID = "seed_tmpl_salary"
const TMPL_RENT_ID = "seed_tmpl_rent"
const TMPL_NETFLIX_ID = "seed_tmpl_netflix"
const TMPL_SPOTIFY_ID = "seed_tmpl_spotify"

const PARENT_LAPTOP_ID = "seed_inst_laptop"
const PARENT_PHONE_ID = "seed_inst_phone"

// System category IDs
const CAT = {
	restaurants: "sys_cat_restaurants",
	groceries: "sys_cat_groceries",
	coffee: "sys_cat_coffee",
	fuel: "sys_cat_fuel",
	publicTransit: "sys_cat_public-transit",
	taxiRideshare: "sys_cat_taxi-rideshare",
	rent: "sys_cat_rent",
	utilities: "sys_cat_utilities",
	entertainment: "sys_cat_entertainment",
	salary: "sys_cat_salary",
	freelance: "sys_cat_freelance",
	subscriptions: "sys_cat_subscriptions",
	shopping: "sys_cat_shopping",
	medical: "sys_cat_medical",
	gym: "sys_cat_gym",
	education: "sys_cat_education",
	transfer: "sys_cat_transfer",
} as const

// Months to seed: Oct 2025 (10) through Mar 2026 (3)
const MONTHS: Array<{ year: number; month: number }> = [
	{ year: 2025, month: 10 },
	{ year: 2025, month: 11 },
	{ year: 2025, month: 12 },
	{ year: 2026, month: 1 },
	{ year: 2026, month: 2 },
	{ year: 2026, month: 3 },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seedUser() {
	console.log("=== Seed User: Starting ===\n")

	// -----------------------------------------------------------------------
	// 1. Create or find user
	// -----------------------------------------------------------------------
	let userId: string

	const existing = await prisma.user.findUnique({
		where: { email: TEST_USER.email },
	})

	if (existing) {
		userId = existing.id
		console.log(`[User] Already exists (id: ${userId}) — reusing.`)
	} else {
		const result = await auth.api.signUpEmail({
			body: {
				email: TEST_USER.email,
				password: TEST_USER.password,
				name: TEST_USER.name,
			},
		})
		userId = (result as { user: { id: string } }).user.id
		console.log(
			`[User] Created "${TEST_USER.email}" with password "${TEST_USER.password}" (id: ${userId})`,
		)
	}

	// -----------------------------------------------------------------------
	// 2. Credit Cards
	// -----------------------------------------------------------------------
	const ccCount = await prisma.creditCard.count({ where: { userId } })

	if (ccCount === 0) {
		console.log("[Credit Cards] Creating 3 credit cards...")

		await prisma.creditCard.createMany({
			data: [
				{
					id: CC_VISA_ID,
					name: "Visa Gold",
					lastFourDigits: "4532",
					brand: "Visa",
					totalLimit: dollars(5000),
					closingDay: 15,
					paymentDay: 5,
					color: "#3b82f6", // blue
					userId,
				},
				{
					id: CC_MC_ID,
					name: "Mastercard Platinum",
					lastFourDigits: "8901",
					brand: "Mastercard",
					totalLimit: dollars(8000),
					closingDay: 20,
					paymentDay: 10,
					color: "#8b5cf6", // purple
					userId,
				},
				{
					id: CC_AMEX_ID,
					name: "Amex Gold",
					lastFourDigits: "3456",
					brand: "American Express",
					totalLimit: dollars(15000),
					closingDay: 25,
					paymentDay: 15,
					color: "#f59e0b", // amber
					userId,
				},
			],
		})

		console.log("[Credit Cards] Done.")
	} else {
		console.log(`[Credit Cards] Already ${ccCount} cards — skipping.`)
	}

	// -----------------------------------------------------------------------
	// 3. Transactions (regular, recurring templates, installments)
	// -----------------------------------------------------------------------
	const txCount = await prisma.transaction.count({ where: { userId } })

	if (txCount === 0) {
		console.log("[Transactions] Generating realistic transactions...")

		type TxInput = {
			id?: string
			amount: number
			description: string
			notes?: string
			date: Date
			impactDate: Date
			type: TransactionType
			paymentMethod: PaymentMethod
			userId: string
			categoryId: string
			creditCardId?: string
			installmentNumber?: number
			totalInstallments?: number
			parentTransactionId?: string
			isTemplate?: boolean
		}

		const transactions: TxInput[] = []

		// --- Monthly recurring: salary, rent, utilities, subscriptions ---
		for (const { year, month } of MONTHS) {
			// Salary — 1st of the month
			transactions.push({
				amount: dollars(randFloat(4800, 5200)),
				description: "Monthly Salary — Acme Corp",
				date: dateOn(year, month, 1),
				impactDate: dateOn(year, month, 1),
				type: TransactionType.INCOME,
				paymentMethod: PaymentMethod.TRANSFER,
				userId,
				categoryId: CAT.salary,
			})

			// Rent — 1st of the month
			transactions.push({
				amount: dollars(1200),
				description: "Monthly Rent — Apartment 4B",
				date: dateOn(year, month, 1),
				impactDate: dateOn(year, month, 1),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.TRANSFER,
				userId,
				categoryId: CAT.rent,
			})

			// Utilities — around the 10th
			transactions.push({
				amount: dollars(randFloat(80, 150)),
				description: pick([
					"Con Edison Electric Bill",
					"National Grid Gas Bill",
					"Utility Payment — Electric & Gas",
				]),
				date: dateOn(year, month, randInt(8, 12)),
				impactDate: dateOn(year, month, randInt(8, 12)),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.DEBIT,
				userId,
				categoryId: CAT.utilities,
			})

			// Netflix
			transactions.push({
				amount: dollars(15.99),
				description: "Netflix Monthly",
				date: dateOn(year, month, 15),
				impactDate: dateOn(year, month, 15),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				userId,
				categoryId: CAT.subscriptions,
				creditCardId: CC_VISA_ID,
			})

			// Spotify
			transactions.push({
				amount: dollars(10.99),
				description: "Spotify Premium",
				date: dateOn(year, month, 12),
				impactDate: dateOn(year, month, 12),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				userId,
				categoryId: CAT.subscriptions,
				creditCardId: CC_VISA_ID,
			})

			// Gym membership
			transactions.push({
				amount: dollars(50),
				description: "Planet Fitness Monthly",
				date: dateOn(year, month, 5),
				impactDate: dateOn(year, month, 5),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.DEBIT,
				userId,
				categoryId: CAT.gym,
			})

			// --- Groceries: 8-12 per month ---
			const groceryCount = randInt(8, 12)
			const groceryStores = [
				"Whole Foods Market",
				"Trader Joe's",
				"Costco",
				"Walmart Grocery",
				"Safeway",
				"Kroger",
				"Aldi",
				"Target Grocery",
			]
			for (let i = 0; i < groceryCount; i++) {
				const d = randomDateInMonth(year, month)
				const useCredit = Math.random() > 0.5
				transactions.push({
					amount: dollars(randFloat(30, 150)),
					description: pick(groceryStores),
					date: d,
					impactDate: useCredit
						? creditCardImpactDate(d, 20, 10)
						: d,
					type: TransactionType.EXPENSE,
					paymentMethod: useCredit
						? PaymentMethod.CREDIT
						: PaymentMethod.DEBIT,
					userId,
					categoryId: CAT.groceries,
					creditCardId: useCredit ? CC_MC_ID : undefined,
				})
			}

			// --- Restaurants: 4-8 per month ---
			const restaurantCount = randInt(4, 8)
			const restaurants = [
				"Chipotle Mexican Grill",
				"Olive Garden",
				"Panda Express",
				"Five Guys Burgers",
				"Shake Shack",
				"Chick-fil-A",
				"Sushi Roku",
				"Thai Basil Kitchen",
				"The Cheesecake Factory",
				"Domino's Pizza",
			]
			for (let i = 0; i < restaurantCount; i++) {
				const d = randomDateInMonth(year, month)
				const ccId = pick([CC_VISA_ID, CC_MC_ID])
				const closingDay = ccId === CC_VISA_ID ? 15 : 20
				const payDay = ccId === CC_VISA_ID ? 5 : 10
				transactions.push({
					amount: dollars(randFloat(15, 80)),
					description: pick(restaurants),
					date: d,
					impactDate: creditCardImpactDate(d, closingDay, payDay),
					type: TransactionType.EXPENSE,
					paymentMethod: PaymentMethod.CREDIT,
					userId,
					categoryId: CAT.restaurants,
					creditCardId: ccId,
				})
			}

			// --- Coffee: 6-10 per month ---
			const coffeeCount = randInt(6, 10)
			const coffeeShops = [
				"Starbucks",
				"Dunkin'",
				"Blue Bottle Coffee",
				"Peet's Coffee",
				"Local Coffee Roasters",
			]
			for (let i = 0; i < coffeeCount; i++) {
				const d = randomDateInMonth(year, month)
				const method = pick([
					PaymentMethod.DEBIT,
					PaymentMethod.CASH,
					PaymentMethod.DEBIT,
				])
				transactions.push({
					amount: dollars(randFloat(3, 8)),
					description: pick(coffeeShops),
					date: d,
					impactDate: d,
					type: TransactionType.EXPENSE,
					paymentMethod: method,
					userId,
					categoryId: CAT.coffee,
				})
			}

			// --- Transport: 4-6 per month ---
			const transportCount = randInt(4, 6)
			const transportOptions = [
				{
					desc: "Shell Gas Station",
					cat: CAT.fuel,
					min: 25,
					max: 60,
				},
				{
					desc: "BP Gas Station",
					cat: CAT.fuel,
					min: 30,
					max: 55,
				},
				{
					desc: "Uber ride downtown",
					cat: CAT.taxiRideshare,
					min: 10,
					max: 35,
				},
				{
					desc: "Lyft to airport",
					cat: CAT.taxiRideshare,
					min: 25,
					max: 50,
				},
				{
					desc: "Metro Card Refill",
					cat: CAT.publicTransit,
					min: 20,
					max: 40,
				},
				{
					desc: "Monthly Transit Pass",
					cat: CAT.publicTransit,
					min: 50,
					max: 60,
				},
			]
			for (let i = 0; i < transportCount; i++) {
				const t = pick(transportOptions)
				const d = randomDateInMonth(year, month)
				const method = pick([PaymentMethod.DEBIT, PaymentMethod.CREDIT])
				const ccId = method === PaymentMethod.CREDIT ? CC_VISA_ID : undefined
				transactions.push({
					amount: dollars(randFloat(t.min, t.max)),
					description: t.desc,
					date: d,
					impactDate:
						ccId
							? creditCardImpactDate(d, 15, 5)
							: d,
					type: TransactionType.EXPENSE,
					paymentMethod: method,
					userId,
					categoryId: t.cat,
					creditCardId: ccId,
				})
			}

			// --- Entertainment: 2-4 per month ---
			const entertainmentCount = randInt(2, 4)
			const entertainmentOptions = [
				"AMC Movie Theater",
				"Bowling Alley",
				"Dave & Buster's",
				"Broadway Show",
				"Escape Room",
				"Concert Tickets — Live Nation",
				"Comedy Club",
			]
			for (let i = 0; i < entertainmentCount; i++) {
				const d = randomDateInMonth(year, month)
				const method = pick([PaymentMethod.CREDIT, PaymentMethod.DEBIT])
				const ccId = method === PaymentMethod.CREDIT ? CC_MC_ID : undefined
				transactions.push({
					amount: dollars(randFloat(10, 50)),
					description: pick(entertainmentOptions),
					date: d,
					impactDate:
						ccId
							? creditCardImpactDate(d, 20, 10)
							: d,
					type: TransactionType.EXPENSE,
					paymentMethod: method,
					userId,
					categoryId: CAT.entertainment,
					creditCardId: ccId,
				})
			}

			// --- Shopping: 2-5 per month ---
			const shoppingCount = randInt(2, 5)
			const shoppingOptions = [
				"Amazon.com",
				"Target",
				"H&M",
				"Zara",
				"Best Buy",
				"Nike Store",
				"IKEA",
				"Home Depot",
				"Uniqlo",
			]
			for (let i = 0; i < shoppingCount; i++) {
				const d = randomDateInMonth(year, month)
				const ccId = pick([CC_VISA_ID, CC_MC_ID, CC_AMEX_ID])
				const closingDay =
					ccId === CC_VISA_ID ? 15 : ccId === CC_MC_ID ? 20 : 25
				const payDay =
					ccId === CC_VISA_ID ? 5 : ccId === CC_MC_ID ? 10 : 15
				transactions.push({
					amount: dollars(randFloat(20, 200)),
					description: pick(shoppingOptions),
					date: d,
					impactDate: creditCardImpactDate(d, closingDay, payDay),
					type: TransactionType.EXPENSE,
					paymentMethod: PaymentMethod.CREDIT,
					userId,
					categoryId: CAT.shopping,
					creditCardId: ccId,
				})
			}
		}

		// --- Freelance: 2-3 scattered across the 6 months ---
		const freelancePayments = [
			{
				amount: dollars(1500),
				desc: "Freelance — Logo Design for Startup",
				year: 2025,
				month: 10,
				day: 20,
			},
			{
				amount: dollars(2000),
				desc: "Freelance — Website Redesign Project",
				year: 2025,
				month: 12,
				day: 8,
			},
			{
				amount: dollars(800),
				desc: "Freelance — Technical Writing",
				year: 2026,
				month: 2,
				day: 14,
			},
		]
		for (const fp of freelancePayments) {
			const d = dateOn(fp.year, fp.month, fp.day)
			transactions.push({
				amount: fp.amount,
				description: fp.desc,
				date: d,
				impactDate: d,
				type: TransactionType.INCOME,
				paymentMethod: PaymentMethod.TRANSFER,
				userId,
				categoryId: CAT.freelance,
			})
		}

		// --- Medical: 2 over 6 months ---
		transactions.push({
			amount: dollars(150),
			description: "Dr. Smith — Annual Checkup Copay",
			date: dateOn(2025, 11, 18),
			impactDate: dateOn(2025, 11, 18),
			type: TransactionType.EXPENSE,
			paymentMethod: PaymentMethod.DEBIT,
			userId,
			categoryId: CAT.medical,
		})
		transactions.push({
			amount: dollars(280),
			description: "CityMD Urgent Care Visit",
			date: dateOn(2026, 2, 5),
			impactDate: dateOn(2026, 2, 5),
			type: TransactionType.EXPENSE,
			paymentMethod: PaymentMethod.DEBIT,
			userId,
			categoryId: CAT.medical,
		})

		// --- Education: 2 courses ---
		transactions.push({
			amount: dollars(199),
			description: "Udemy — Advanced TypeScript Course",
			date: dateOn(2025, 10, 22),
			impactDate: dateOn(2025, 10, 22),
			type: TransactionType.EXPENSE,
			paymentMethod: PaymentMethod.CREDIT,
			userId,
			categoryId: CAT.education,
			creditCardId: CC_VISA_ID,
		})
		transactions.push({
			amount: dollars(499),
			description: "Frontend Masters Annual Subscription",
			date: dateOn(2026, 1, 10),
			impactDate: dateOn(2026, 1, 10),
			type: TransactionType.EXPENSE,
			paymentMethod: PaymentMethod.CREDIT,
			userId,
			categoryId: CAT.education,
			creditCardId: CC_VISA_ID,
		})

		// Create all regular transactions
		await prisma.transaction.createMany({ data: transactions })
		console.log(
			`[Transactions] Created ${transactions.length} regular transactions.`,
		)

		// --- Installment purchases ---
		console.log("[Transactions] Creating installment purchases...")

		// Laptop: $1200 in 6 installments on Visa, purchased Nov 2025
		const laptopPurchaseDate = dateOn(2025, 11, 10)
		await prisma.transaction.create({
			data: {
				id: PARENT_LAPTOP_ID,
				amount: dollars(1200),
				description: "MacBook Air M3 — Best Buy",
				date: laptopPurchaseDate,
				impactDate: creditCardImpactDate(laptopPurchaseDate, 15, 5),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				userId,
				categoryId: CAT.shopping,
				creditCardId: CC_VISA_ID,
				totalInstallments: 6,
				installmentNumber: 1,
			},
		})

		const laptopInstallments = []
		for (let i = 2; i <= 6; i++) {
			const installMonth = 11 + i - 1 // Nov=11, so installment 2=Dec, 3=Jan, etc.
			const year = installMonth <= 12 ? 2025 : 2026
			const month = installMonth <= 12 ? installMonth : installMonth - 12
			const d = dateOn(year, month, 5) // payment day for Visa
			laptopInstallments.push({
				amount: dollars(200), // 1200 / 6
				description: `MacBook Air M3 — Best Buy (${i}/6)`,
				date: d,
				impactDate: d,
				type: TransactionType.EXPENSE as TransactionType,
				paymentMethod: PaymentMethod.CREDIT as PaymentMethod,
				userId,
				categoryId: CAT.shopping,
				creditCardId: CC_VISA_ID,
				installmentNumber: i,
				totalInstallments: 6,
				parentTransactionId: PARENT_LAPTOP_ID,
			})
		}
		await prisma.transaction.createMany({ data: laptopInstallments })

		// Phone: $800 in 4 installments on Mastercard, purchased Jan 2026
		const phonePurchaseDate = dateOn(2026, 1, 8)
		await prisma.transaction.create({
			data: {
				id: PARENT_PHONE_ID,
				amount: dollars(800),
				description: "iPhone 16 Pro — Apple Store",
				date: phonePurchaseDate,
				impactDate: creditCardImpactDate(phonePurchaseDate, 20, 10),
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				userId,
				categoryId: CAT.shopping,
				creditCardId: CC_MC_ID,
				totalInstallments: 4,
				installmentNumber: 1,
			},
		})

		const phoneInstallments = []
		for (let i = 2; i <= 4; i++) {
			const month = 1 + i - 1 // Jan=1, so installment 2=Feb, 3=Mar, 4=Apr
			const d = dateOn(2026, month, 10) // payment day for MC
			phoneInstallments.push({
				amount: dollars(200), // 800 / 4
				description: `iPhone 16 Pro — Apple Store (${i}/4)`,
				date: d,
				impactDate: d,
				type: TransactionType.EXPENSE as TransactionType,
				paymentMethod: PaymentMethod.CREDIT as PaymentMethod,
				userId,
				categoryId: CAT.shopping,
				creditCardId: CC_MC_ID,
				installmentNumber: i,
				totalInstallments: 4,
				parentTransactionId: PARENT_PHONE_ID,
			})
		}
		await prisma.transaction.createMany({ data: phoneInstallments })

		console.log("[Transactions] Installment purchases created.")

		// --- Recurring templates ---
		console.log("[Transactions] Creating recurring templates...")

		const templates = [
			{
				id: TMPL_SALARY_ID,
				amount: dollars(5000),
				description: "Monthly Salary — Acme Corp",
				categoryId: CAT.salary,
				type: TransactionType.INCOME,
				paymentMethod: PaymentMethod.TRANSFER,
				day: 1,
			},
			{
				id: TMPL_RENT_ID,
				amount: dollars(1200),
				description: "Monthly Rent — Apartment 4B",
				categoryId: CAT.rent,
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.TRANSFER,
				day: 1,
			},
			{
				id: TMPL_NETFLIX_ID,
				amount: dollars(15.99),
				description: "Netflix Monthly",
				categoryId: CAT.subscriptions,
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				day: 15,
			},
			{
				id: TMPL_SPOTIFY_ID,
				amount: dollars(10.99),
				description: "Spotify Premium",
				categoryId: CAT.subscriptions,
				type: TransactionType.EXPENSE,
				paymentMethod: PaymentMethod.CREDIT,
				day: 12,
			},
		]

		for (const tmpl of templates) {
			await prisma.transaction.create({
				data: {
					id: tmpl.id,
					amount: tmpl.amount,
					description: tmpl.description,
					date: dateOn(2026, 3, tmpl.day),
					impactDate: dateOn(2026, 3, tmpl.day),
					type: tmpl.type,
					paymentMethod: tmpl.paymentMethod,
					userId,
					categoryId: tmpl.categoryId,
					isTemplate: true,
					recurrenceRule: {
						create: {
							frequency: RecurrenceFrequency.MONTHLY,
							interval: 1,
							nextGenerationDate: dateOn(2026, 4, tmpl.day),
							isActive: true,
						},
					},
				},
			})
		}

		console.log("[Transactions] Recurring templates created.")
	} else {
		console.log(`[Transactions] Already ${txCount} transactions — skipping.`)
	}

	// -----------------------------------------------------------------------
	// 4. Goals
	// -----------------------------------------------------------------------
	const goalCount = await prisma.goal.count({ where: { userId } })

	if (goalCount === 0) {
		console.log("[Goals] Creating 3 goals with contributions...")

		// Emergency Fund
		await prisma.goal.create({
			data: {
				id: GOAL_EMERGENCY_ID,
				name: "Emergency Fund",
				description:
					"Build a 3-month emergency fund for unexpected expenses",
				targetAmount: dollars(10000),
				targetDate: new Date("2026-12-31"),
				status: GoalStatus.ACTIVE,
				userId,
				contributions: {
					createMany: {
						data: [
							{
								amount: dollars(500),
								date: dateOn(2025, 10, 5),
								note: "Initial contribution",
								userId,
							},
							{
								amount: dollars(600),
								date: dateOn(2025, 11, 5),
								note: "Monthly savings",
								userId,
							},
							{
								amount: dollars(700),
								date: dateOn(2025, 12, 5),
								note: "Holiday bonus added",
								userId,
							},
							{
								amount: dollars(500),
								date: dateOn(2026, 1, 5),
								note: "Monthly savings",
								userId,
							},
							{
								amount: dollars(600),
								date: dateOn(2026, 2, 5),
								note: "Monthly savings",
								userId,
							},
							{
								amount: dollars(600),
								date: dateOn(2026, 3, 5),
								note: "Monthly savings",
								userId,
							},
						],
					},
				},
			},
		})

		// Vacation to Japan
		await prisma.goal.create({
			data: {
				id: GOAL_VACATION_ID,
				name: "Vacation to Japan",
				description: "2-week trip to Tokyo and Kyoto in summer 2026",
				targetAmount: dollars(5000),
				targetDate: new Date("2026-08-01"),
				status: GoalStatus.ACTIVE,
				userId,
				contributions: {
					createMany: {
						data: [
							{
								amount: dollars(200),
								date: dateOn(2025, 10, 15),
								note: "Starting to save",
								userId,
							},
							{
								amount: dollars(200),
								date: dateOn(2025, 11, 15),
								userId,
							},
							{
								amount: dollars(200),
								date: dateOn(2025, 12, 15),
								userId,
							},
							{
								amount: dollars(200),
								date: dateOn(2026, 1, 15),
								userId,
							},
							{
								amount: dollars(200),
								date: dateOn(2026, 2, 15),
								userId,
							},
							{
								amount: dollars(200),
								date: dateOn(2026, 3, 15),
								note: "Halfway there!",
								userId,
							},
						],
					},
				},
			},
		})

		// New Car Down Payment
		await prisma.goal.create({
			data: {
				id: GOAL_CAR_ID,
				name: "New Car Down Payment",
				description: "Save for a down payment on a new Honda Civic",
				targetAmount: dollars(8000),
				targetDate: new Date("2027-06-01"),
				status: GoalStatus.ACTIVE,
				userId,
				contributions: {
					createMany: {
						data: [
							{
								amount: dollars(300),
								date: dateOn(2026, 1, 20),
								note: "Started saving",
								userId,
							},
							{
								amount: dollars(250),
								date: dateOn(2026, 2, 20),
								userId,
							},
							{
								amount: dollars(250),
								date: dateOn(2026, 3, 20),
								userId,
							},
						],
					},
				},
			},
		})

		console.log("[Goals] Done.")
	} else {
		console.log(`[Goals] Already ${goalCount} goals — skipping.`)
	}

	// -----------------------------------------------------------------------
	// 5. Investments
	// -----------------------------------------------------------------------
	const invCount = await prisma.investment.count({ where: { userId } })

	if (invCount === 0) {
		console.log("[Investments] Creating 4 investments with snapshots...")

		// S&P 500 ETF — started Jun 2025
		const sp500Snapshots = [
			{ date: dateOn(2025, 6, 1), value: dollars(5000) },
			{ date: dateOn(2025, 7, 1), value: dollars(5080) },
			{ date: dateOn(2025, 8, 1), value: dollars(5150) },
			{ date: dateOn(2025, 9, 1), value: dollars(5100) },
			{ date: dateOn(2025, 10, 1), value: dollars(5250) },
			{ date: dateOn(2025, 11, 1), value: dollars(5320) },
			{ date: dateOn(2025, 12, 1), value: dollars(5400) },
			{ date: dateOn(2026, 1, 1), value: dollars(5480) },
			{ date: dateOn(2026, 2, 1), value: dollars(5550) },
			{ date: dateOn(2026, 3, 1), value: dollars(5650) },
		]

		await prisma.investment.create({
			data: {
				id: INV_SP500_ID,
				type: InvestmentType.FUND,
				name: "Vanguard S&P 500 ETF (VOO)",
				institution: "Vanguard",
				initialAmount: dollars(5000),
				currentValue: dollars(5650),
				currency: "USD",
				startDate: dateOn(2025, 6, 1),
				isActive: true,
				userId,
				snapshots: {
					createMany: {
						data: sp500Snapshots.map((s) => ({
							date: s.date,
							value: s.value,
						})),
					},
				},
			},
		})

		// Apple Stock — started Aug 2025
		const appleSnapshots = [
			{ date: dateOn(2025, 8, 1), value: dollars(3000) },
			{ date: dateOn(2025, 9, 1), value: dollars(3050) },
			{ date: dateOn(2025, 10, 1), value: dollars(3120) },
			{ date: dateOn(2025, 11, 1), value: dollars(3200) },
			{ date: dateOn(2025, 12, 1), value: dollars(3150) },
			{ date: dateOn(2026, 1, 1), value: dollars(3280) },
			{ date: dateOn(2026, 2, 1), value: dollars(3350) },
			{ date: dateOn(2026, 3, 1), value: dollars(3400) },
		]

		await prisma.investment.create({
			data: {
				id: INV_APPLE_ID,
				type: InvestmentType.STOCKS,
				name: "Apple Inc. (AAPL)",
				institution: "Robinhood",
				initialAmount: dollars(3000),
				currentValue: dollars(3400),
				currency: "USD",
				startDate: dateOn(2025, 8, 1),
				isActive: true,
				userId,
				snapshots: {
					createMany: {
						data: appleSnapshots.map((s) => ({
							date: s.date,
							value: s.value,
						})),
					},
				},
			},
		})

		// Bitcoin — started Sep 2025, volatile
		const btcSnapshots = [
			{ date: dateOn(2025, 9, 1), value: dollars(2000) },
			{ date: dateOn(2025, 10, 1), value: dollars(2300) },
			{ date: dateOn(2025, 11, 1), value: dollars(2100) },
			{ date: dateOn(2025, 12, 1), value: dollars(2500) },
			{ date: dateOn(2026, 1, 1), value: dollars(2350) },
			{ date: dateOn(2026, 2, 1), value: dollars(2700) },
			{ date: dateOn(2026, 3, 1), value: dollars(2800) },
		]

		await prisma.investment.create({
			data: {
				id: INV_BTC_ID,
				type: InvestmentType.CRYPTO,
				name: "Bitcoin (BTC)",
				institution: "Coinbase",
				initialAmount: dollars(2000),
				currentValue: dollars(2800),
				currency: "USD",
				startDate: dateOn(2025, 9, 1),
				isActive: true,
				userId,
				snapshots: {
					createMany: {
						data: btcSnapshots.map((s) => ({
							date: s.date,
							value: s.value,
						})),
					},
				},
			},
		})

		// Savings Account — started Jan 2025
		const savingsSnapshots = [
			{ date: dateOn(2025, 1, 1), value: dollars(10000) },
			{ date: dateOn(2025, 2, 1), value: dollars(10025) },
			{ date: dateOn(2025, 3, 1), value: dollars(10050) },
			{ date: dateOn(2025, 4, 1), value: dollars(10075) },
			{ date: dateOn(2025, 5, 1), value: dollars(10100) },
			{ date: dateOn(2025, 6, 1), value: dollars(10125) },
			{ date: dateOn(2025, 7, 1), value: dollars(10150) },
			{ date: dateOn(2025, 8, 1), value: dollars(10175) },
			{ date: dateOn(2025, 9, 1), value: dollars(10200) },
			{ date: dateOn(2025, 10, 1), value: dollars(10225) },
			{ date: dateOn(2025, 11, 1), value: dollars(10250) },
			{ date: dateOn(2025, 12, 1), value: dollars(10275) },
			{ date: dateOn(2026, 1, 1), value: dollars(10300) },
			{ date: dateOn(2026, 2, 1), value: dollars(10300) },
			{ date: dateOn(2026, 3, 1), value: dollars(10300) },
		]

		await prisma.investment.create({
			data: {
				id: INV_SAVINGS_ID,
				type: InvestmentType.SAVINGS,
				name: "High-Yield Savings Account",
				institution: "Chase",
				initialAmount: dollars(10000),
				currentValue: dollars(10300),
				currency: "USD",
				startDate: dateOn(2025, 1, 1),
				maturityDate: new Date("2026-12-31"),
				estimatedReturn: dollars(300),
				isActive: true,
				userId,
				snapshots: {
					createMany: {
						data: savingsSnapshots.map((s) => ({
							date: s.date,
							value: s.value,
						})),
					},
				},
			},
		})

		console.log("[Investments] Done.")
	} else {
		console.log(`[Investments] Already ${invCount} investments — skipping.`)
	}

	// -----------------------------------------------------------------------
	// 6. Alerts
	// -----------------------------------------------------------------------
	const alertCount = await prisma.alert.count({ where: { userId } })

	if (alertCount === 0) {
		console.log("[Alerts] Creating 6 alerts...")

		await prisma.alert.createMany({
			data: [
				{
					type: AlertType.CATEGORY_THRESHOLD_EXCEEDED,
					message:
						"Restaurant spending exceeded $400 this month — 20% above your usual pattern.",
					severity: AlertSeverity.WARNING,
					status: AlertStatus.PENDING,
					referenceType: "category",
					referenceId: CAT.restaurants,
					deduplicationKey: "cat-threshold-restaurants-2026-03",
					userId,
				},
				{
					type: AlertType.CREDIT_CARD_PAYMENT_DUE,
					message:
						"Visa Gold payment of $1,247.50 is due on April 5th. Don't miss it!",
					severity: AlertSeverity.INFO,
					status: AlertStatus.PENDING,
					referenceType: "creditCard",
					referenceId: CC_VISA_ID,
					deduplicationKey: "cc-payment-visa-2026-04",
					userId,
				},
				{
					type: AlertType.GOAL_MILESTONE,
					message:
						"You've reached 35% of your Emergency Fund goal! Keep it up.",
					severity: AlertSeverity.INFO,
					status: AlertStatus.READ,
					referenceType: "goal",
					referenceId: GOAL_EMERGENCY_ID,
					deduplicationKey: "goal-milestone-emergency-35",
					userId,
				},
				{
					type: AlertType.INVESTMENT_SIGNIFICANT_CHANGE,
					message:
						"Bitcoin is up 15% this month. Consider reviewing your crypto allocation.",
					severity: AlertSeverity.WARNING,
					status: AlertStatus.PENDING,
					referenceType: "investment",
					referenceId: INV_BTC_ID,
					deduplicationKey: "inv-change-btc-2026-03",
					userId,
				},
				{
					type: AlertType.CATEGORY_SPENDING_SPIKE,
					message:
						"Shopping spending spiked 45% compared to last month. Mostly online purchases.",
					severity: AlertSeverity.WARNING,
					status: AlertStatus.DISMISSED,
					referenceType: "category",
					referenceId: CAT.shopping,
					deduplicationKey: "cat-spike-shopping-2026-02",
					userId,
				},
				{
					type: AlertType.NEGATIVE_BALANCE_RISK,
					message:
						"Based on upcoming payments, your balance may go negative around April 8th.",
					severity: AlertSeverity.CRITICAL,
					status: AlertStatus.PENDING,
					referenceType: "balance",
					referenceId: "projected-balance-2026-04",
					deduplicationKey: "neg-balance-2026-04",
					userId,
				},
			],
		})

		console.log("[Alerts] Done.")
	} else {
		console.log(`[Alerts] Already ${alertCount} alerts — skipping.`)
	}

	// -----------------------------------------------------------------------
	// Done
	// -----------------------------------------------------------------------
	console.log("\n=== Seed User: Complete ===")
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

seedUser()
	.catch((e) => {
		console.error("Failed to seed user:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
