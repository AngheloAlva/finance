import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}))
vi.mock("@/shared/lib/auth", () => ({
	requireSession: vi.fn(),
	getSession: vi.fn(),
}))

import { getAccumulatedBalance } from "@/features/analytics/lib/projection.queries"
import { OPENING_BALANCE_CATEGORY_ID } from "@/features/categories/lib/system-categories"
import { createOpeningBalanceAction } from "@/features/dashboard/actions/create-opening-balance.action"
import { getMonthlyOverview } from "@/features/dashboard/lib/dashboard.queries"
import { prisma } from "@/shared/lib/prisma"
import { createCategory, createUser, dollars } from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

const initialState = { success: true as const, data: undefined }

async function createOpeningBalanceCategory() {
	return createCategory(null, { id: OPENING_BALANCE_CATEGORY_ID, scope: "SYSTEM" })
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe("createOpeningBalanceAction", () => {
	it("records the amount as an opening-balance transfer", async () => {
		const user = await createUser()
		setSessionUser(user.id)
		await createOpeningBalanceCategory()

		const result = await createOpeningBalanceAction(
			initialState,
			formData({ amount: String(dollars(1200)), date: "2026-11-06", description: "Saldo inicial" }),
		)

		expect(result.success).toBe(true)
		const transactions = await prisma.transaction.findMany({ where: { userId: user.id } })
		expect(transactions).toHaveLength(1)
		expect(transactions[0]).toMatchObject({
			type: "TRANSFER",
			categoryId: OPENING_BALANCE_CATEGORY_ID,
			amount: dollars(1200),
			description: "Saldo inicial",
			paymentMethod: "OTHER",
		})
	})

	it("adds to the accumulated balance without counting as monthly income", async () => {
		const user = await createUser()
		setSessionUser(user.id)
		await createOpeningBalanceCategory()
		const today = new Date()
		const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`

		await createOpeningBalanceAction(
			initialState,
			formData({ amount: String(dollars(800)), date, description: "Saldo inicial" }),
		)

		expect(await getAccumulatedBalance(user.id)).toBe(dollars(800))
		const overview = await getMonthlyOverview(user.id, today.getMonth() + 1, today.getFullYear())
		expect(overview.totalIncome).toBe(0)
		expect(overview.balance).toBe(0)
	})

	it("rejects a non-positive amount without saving anything", async () => {
		const user = await createUser()
		setSessionUser(user.id)
		await createOpeningBalanceCategory()

		const result = await createOpeningBalanceAction(
			initialState,
			formData({ amount: "0", date: "2026-11-06", description: "Saldo inicial" }),
		)

		expect(result.success).toBe(false)
		if (!result.success) expect(result.fieldErrors?.amount).toBeDefined()
		expect(await prisma.transaction.count({ where: { userId: user.id } })).toBe(0)
	})

	it("refuses a second opening balance for the same account", async () => {
		const user = await createUser()
		setSessionUser(user.id)
		await createOpeningBalanceCategory()
		const input = { amount: String(dollars(500)), date: "2026-11-06", description: "Saldo inicial" }

		await createOpeningBalanceAction(initialState, formData(input))
		const second = await createOpeningBalanceAction(initialState, formData(input))

		expect(second).toEqual({ success: false, error: "OPENING_BALANCE_EXISTS" })
		expect(await prisma.transaction.count({ where: { userId: user.id } })).toBe(1)
	})
})
