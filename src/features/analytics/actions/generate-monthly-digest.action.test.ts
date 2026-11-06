import { beforeEach, describe, expect, it, vi } from "vitest"

// Memoizing stand-in for unstable_cache, so tests can observe what gets cached.
vi.mock("next/cache", () => ({
	unstable_cache: <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => {
		const cache = new Map<string, R>()
		return async (...args: A) => {
			const key = JSON.stringify(args)
			if (!cache.has(key)) cache.set(key, await fn(...args))
			return cache.get(key) as R
		}
	},
}))
vi.mock("next-intl/server", () => ({
	getLocale: vi.fn(async () => "es"),
}))
vi.mock("@/shared/lib/auth", () => ({
	requireSession: vi.fn(),
	getSession: vi.fn(),
}))
vi.mock("@/shared/lib/claude", () => ({
	CLAUDE_MODEL: "test-model",
	claude: { messages: { create: vi.fn() } },
}))

import { generateMonthlyDigestAction } from "@/features/analytics/actions/generate-monthly-digest.action"
import { claude } from "@/shared/lib/claude"
import { createTransaction, createUser, dollars } from "../../../../tests/helpers/factories"
import { setSessionUser } from "../../../../tests/helpers/action-test"

const MID_MARCH_2025 = new Date(2025, 2, 15, 12)

beforeEach(() => {
	vi.clearAllMocks()
	vi.mocked(claude.messages.create).mockResolvedValue({
		content: [{ type: "text", text: "Buen mes." }],
		stop_reason: "end_turn",
	} as never)
})

describe("generateMonthlyDigestAction", () => {
	it("returns empty without calling Claude when the month has no transactions", async () => {
		const user = await createUser()
		setSessionUser(user.id)

		const result = await generateMonthlyDigestAction(1, 2020)

		expect(result).toEqual({ empty: true })
		expect(claude.messages.create).not.toHaveBeenCalled()
	})

	it("asks Claude for a summary when the month has transactions", async () => {
		const user = await createUser()
		setSessionUser(user.id)
		await createTransaction(user.id, { amount: -dollars(20), type: "EXPENSE", date: MID_MARCH_2025 })

		const result = await generateMonthlyDigestAction(3, 2025)

		expect(result).toEqual({ text: "Buen mes." })
		expect(claude.messages.create).toHaveBeenCalledOnce()
	})

	it("summarizes right after the first transaction of an empty month", async () => {
		const user = await createUser()
		setSessionUser(user.id)

		expect(await generateMonthlyDigestAction(3, 2025)).toEqual({ empty: true })
		await createTransaction(user.id, { amount: -dollars(20), type: "EXPENSE", date: MID_MARCH_2025 })

		expect(await generateMonthlyDigestAction(3, 2025)).toEqual({ text: "Buen mes." })
	})
})
