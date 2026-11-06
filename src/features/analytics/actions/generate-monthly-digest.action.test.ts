import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
	unstable_cache: <T>(fn: T) => fn,
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

beforeEach(() => {
	vi.clearAllMocks()
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
		const now = new Date()
		await createTransaction(user.id, { amount: -dollars(20), type: "EXPENSE", date: now })
		vi.mocked(claude.messages.create).mockResolvedValue({
			content: [{ type: "text", text: "Buen mes." }],
			stop_reason: "end_turn",
		} as never)

		const result = await generateMonthlyDigestAction(now.getMonth() + 1, now.getFullYear())

		expect(result).toEqual({ text: "Buen mes." })
		expect(claude.messages.create).toHaveBeenCalledOnce()
	})
})
