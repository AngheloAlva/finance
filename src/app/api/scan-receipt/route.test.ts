import { AnthropicError } from "@anthropic-ai/sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getUserCategories, parse, suggestCategoryAction } = vi.hoisted(() => ({
	getUserCategories: vi.fn(),
	parse: vi.fn(),
	suggestCategoryAction: vi.fn(),
}))

vi.mock("@/shared/lib/auth", () => ({
	requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}))

vi.mock("@/shared/lib/claude", () => ({
	CLAUDE_MODEL: "claude-test",
	claude: { messages: { parse } },
}))

vi.mock("@/features/categories/lib/categories.queries", () => ({ getUserCategories }))

vi.mock("@/features/categorization/actions/suggest-category.action", () => ({
	suggestCategoryAction,
}))

import { POST } from "./route"

function scanRequest(file?: File) {
	const formData = new FormData()
	if (file) formData.append("image", file)
	return new Request("http://localhost/api/scan-receipt", { method: "POST", body: formData })
}

const receipt = (overrides: { categoryIndex: number | null }) => ({
	amount: 30000,
	description: "Lider",
	date: "2026-11-02",
	paymentMethod: "DEBIT",
	...overrides,
})

const jpeg = () => new File([new Uint8Array([1, 2, 3])], "receipt.jpg", { type: "image/jpeg" })

describe("POST /api/scan-receipt", () => {
	beforeEach(() => {
		parse.mockReset()
		suggestCategoryAction.mockReset().mockResolvedValue(null)
		getUserCategories.mockReset().mockResolvedValue([
			{ id: "food", name: "Food", transactionType: "EXPENSE", parentId: null },
			{ id: "groceries", name: "Groceries", transactionType: "EXPENSE", parentId: "food" },
			{ id: "salary", name: "Salary", transactionType: "INCOME", parentId: null },
		])
	})

	it("sends the image to Claude and returns the extracted fields", async () => {
		const extracted = {
			amount: 30000,
			description: "Lider",
			date: "2026-11-02",
			paymentMethod: "DEBIT",
		}
		parse.mockResolvedValue({
			stop_reason: "end_turn",
			parsed_output: { ...extracted, categoryIndex: null },
		})

		const res = await POST(scanRequest(jpeg()))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ ...extracted, categoryId: null })

		const params = parse.mock.calls[0][0]
		expect(params.model).toBe("claude-test")
		expect(params.messages[0].content[0]).toEqual({
			type: "image",
			source: { type: "base64", media_type: "image/jpeg", data: "AQID" },
		})
	})

	it("offers only the user's expense categories and returns the one Claude picks", async () => {
		parse.mockResolvedValue({
			stop_reason: "end_turn",
			parsed_output: receipt({ categoryIndex: 1 }),
		})

		const res = await POST(scanRequest(jpeg()))

		expect((await res.json()).categoryId).toBe("groceries")
		const prompt = parse.mock.calls[0][0].messages[0].content[1].text
		expect(prompt).toContain("0: Food")
		expect(prompt).toContain("1: Food > Groceries")
		expect(prompt).not.toContain("Salary")
	})

	it("prefers the user's learned rule over Claude's pick", async () => {
		suggestCategoryAction.mockResolvedValue({ categoryId: "learned" })
		parse.mockResolvedValue({
			stop_reason: "end_turn",
			parsed_output: receipt({ categoryIndex: 0 }),
		})

		const res = await POST(scanRequest(jpeg()))

		expect((await res.json()).categoryId).toBe("learned")
		expect(suggestCategoryAction).toHaveBeenCalledWith("Lider")
	})

	it("ignores a category index outside the offered list", async () => {
		parse.mockResolvedValue({
			stop_reason: "end_turn",
			parsed_output: receipt({ categoryIndex: 9 }),
		})

		const res = await POST(scanRequest(jpeg()))

		expect((await res.json()).categoryId).toBeNull()
	})

	it("still returns the extracted fields when categories cannot be loaded", async () => {
		getUserCategories.mockRejectedValue(new Error("db down"))
		suggestCategoryAction.mockRejectedValue(new Error("db down"))
		parse.mockResolvedValue({
			stop_reason: "end_turn",
			parsed_output: receipt({ categoryIndex: 0 }),
		})

		const res = await POST(scanRequest(jpeg()))

		expect(res.status).toBe(200)
		expect(await res.json()).toMatchObject({ description: "Lider", categoryId: null })
	})

	it("rejects a request without an image and does not call Claude", async () => {
		const res = await POST(scanRequest())

		expect(res.status).toBe(400)
		expect(await res.json()).toEqual({ error: "MISSING_IMAGE" })
		expect(parse).not.toHaveBeenCalled()
	})

	it("rejects image formats Claude cannot read and does not call Claude", async () => {
		const heic = new File([new Uint8Array([1])], "receipt.heic", { type: "image/heic" })

		const res = await POST(scanRequest(heic))

		expect(res.status).toBe(415)
		expect(await res.json()).toEqual({ error: "INVALID_TYPE" })
		expect(parse).not.toHaveBeenCalled()
	})

	it("rejects files over 5 MB and does not call Claude", async () => {
		const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "receipt.jpg", {
			type: "image/jpeg",
		})

		const res = await POST(scanRequest(large))

		expect(res.status).toBe(413)
		expect(await res.json()).toEqual({ error: "FILE_TOO_LARGE" })
		expect(parse).not.toHaveBeenCalled()
	})

	it("returns PARSE_FAILED when Claude refuses", async () => {
		parse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null })

		const res = await POST(scanRequest(jpeg()))

		expect(res.status).toBe(422)
		expect(await res.json()).toEqual({ error: "PARSE_FAILED" })
	})

	it("returns PARSE_FAILED when the output does not match the schema", async () => {
		parse.mockRejectedValue(new AnthropicError("Failed to parse structured output"))

		const res = await POST(scanRequest(jpeg()))

		expect(res.status).toBe(422)
		expect(await res.json()).toEqual({ error: "PARSE_FAILED" })
	})

	it("returns SCAN_FAILED when the Claude API call fails", async () => {
		parse.mockRejectedValue(new Error("upstream down"))

		const res = await POST(scanRequest(jpeg()))

		expect(res.status).toBe(502)
		expect(await res.json()).toEqual({ error: "SCAN_FAILED" })
	})
})
