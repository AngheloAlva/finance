import { APIError, AnthropicError } from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserCategories } from "@/features/categories/lib/categories.queries"
import { suggestCategoryAction } from "@/features/categorization/actions/suggest-category.action"
import { TransactionType } from "@/generated/prisma/enums"
import { requireSession } from "@/shared/lib/auth"
import { CLAUDE_MODEL, claude } from "@/shared/lib/claude"

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

function isSupportedImageType(type: string): type is SupportedImageType {
	return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(type)
}

const receiptSchema = z.object({
	amount: z.number().nullable(),
	description: z.string().nullable(),
	date: z.string().nullable(),
	paymentMethod: z.enum(["CASH", "DEBIT", "CREDIT", "TRANSFER", "OTHER"]).nullable(),
	categoryIndex: z.number().int().nullable(),
})

const SYSTEM_PROMPT = `You extract structured data from receipts and payment screenshots.

Field rules:
- amount: the total as a decimal (e.g. 12.50), without currency symbols.
- description: the merchant name or a brief item description.
- date: in strict YYYY-MM-DD format. Convert any other format to this.
- paymentMethod: exactly one of CASH, DEBIT, CREDIT, TRANSFER, OTHER.
- categoryIndex: the number of the category from the provided list that best fits the purchase. Prefer the most specific fit. Use null when no category clearly fits or no list is provided.

Number format rules for amount:
Latin American and European receipts use "." as a THOUSANDS separator and "," as a DECIMAL separator. You MUST detect the format and convert correctly.
- "$30.000" or "30.000" (no comma anywhere) → 30000 (thirty thousand). The dot is thousands.
- "$1.250,50" or "1.250,50" → 1250.50. Dot is thousands, comma is decimal.
- "$1,250.50" or "1,250.50" (US/UK format) → 1250.50. Comma is thousands, dot is decimal.
- "12,50" → 12.50. Comma is decimal (LATAM/EU format with no thousands).
- "12.50" alone, with cents context (e.g. small purchase, two decimals) → 12.50.
Heuristic: if you see a "." followed by exactly 3 digits and no other separators, treat it as thousands (e.g. "30.000" = 30000, not 30). If unsure, prefer the larger interpretation when the receipt currency typically has no fractional cents shown.

Mapping rules for paymentMethod:
- "credit", "crédito", "mastercard credit", "visa credit" → "CREDIT"
- "debit", "débito", "mastercard debit", "visa debit" → "DEBIT"
- "cash", "efectivo" → "CASH"
- "transfer", "transferencia", "wire" → "TRANSFER"
- anything else (or unclear) → "OTHER"
- not visible → null

Use null (not an empty string, not "N/A") for any field you cannot determine.`

async function getExpenseCategoryOptions(userId: string) {
	const categories = await getUserCategories(userId).catch(() => [])
	const namesById = new Map(categories.map((category) => [category.id, category.name]))

	return categories
		.filter((category) => category.transactionType === TransactionType.EXPENSE)
		.map((category) => {
			const parentName = category.parentId ? namesById.get(category.parentId) : undefined
			return {
				id: category.id,
				label: parentName ? `${parentName} > ${category.name}` : category.name,
			}
		})
}

function buildUserPrompt(categoryLabels: string[]) {
	if (categoryLabels.length === 0) return "Extract the receipt data."

	const list = categoryLabels.map((label, index) => `${index}: ${label}`).join("\n")
	return `Extract the receipt data.\n\nCategories:\n${list}`
}

export async function POST(request: Request) {
	const session = await requireSession()

	const formData = await request.formData()
	const file = formData.get("image")

	if (!file || !(file instanceof File)) {
		return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 })
	}

	if (!isSupportedImageType(file.type)) {
		return NextResponse.json({ error: "INVALID_TYPE" }, { status: 415 })
	}

	if (file.size > 5 * 1024 * 1024) {
		return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 })
	}

	const imageData = Buffer.from(await file.arrayBuffer()).toString("base64")
	const categoryOptions = await getExpenseCategoryOptions(session.user.id)

	try {
		const response = await claude.messages.parse({
			model: CLAUDE_MODEL,
			max_tokens: 16000,
			system: SYSTEM_PROMPT,
			output_config: { format: zodOutputFormat(receiptSchema) },
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							source: { type: "base64", media_type: file.type, data: imageData },
						},
						{
							type: "text",
							text: buildUserPrompt(categoryOptions.map((option) => option.label)),
						},
					],
				},
			],
		})

		if (response.stop_reason === "refusal" || !response.parsed_output) {
			return NextResponse.json({ error: "PARSE_FAILED" }, { status: 422 })
		}

		const { categoryIndex, ...fields } = response.parsed_output
		const learned = fields.description
			? await suggestCategoryAction(fields.description).catch(() => null)
			: null
		const picked = categoryIndex === null ? undefined : categoryOptions[categoryIndex]

		return NextResponse.json({
			...fields,
			categoryId: learned?.categoryId ?? picked?.id ?? null,
		})
	} catch (error) {
		// The SDK throws a plain AnthropicError when the output fails to parse;
		// request and connection failures are APIError subclasses.
		if (error instanceof AnthropicError && !(error instanceof APIError)) {
			return NextResponse.json({ error: "PARSE_FAILED" }, { status: 422 })
		}

		console.error("Receipt scan failed", error)
		return NextResponse.json({ error: "SCAN_FAILED" }, { status: 502 })
	}
}
