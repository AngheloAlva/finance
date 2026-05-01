import { moonshotai } from "@ai-sdk/moonshotai"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { z } from "zod"

import { requireSession } from "@/shared/lib/auth"

const receiptSchema = z.object({
	amount: z.number().nullable(),
	description: z.string().nullable(),
	date: z.string().nullable(),
	paymentMethod: z.enum(["CASH", "DEBIT", "CREDIT", "TRANSFER", "OTHER"]).nullable(),
})

const SYSTEM_PROMPT = `You extract structured data from receipts and payment screenshots. You MUST respond with ONLY a JSON object — no markdown, no code fences, no explanations.

The JSON object MUST have EXACTLY these four keys, with these exact names and types:
- "amount": number or null — the total as a decimal (e.g. 12.50). No currency symbols.
- "description": string or null — the merchant name or a brief item description.
- "date": string or null — date in strict YYYY-MM-DD format. Convert any other format to this.
- "paymentMethod": string or null — must be EXACTLY one of "CASH", "DEBIT", "CREDIT", "TRANSFER", "OTHER".

CRITICAL — number format rules for "amount":
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

Use null (not empty string, not "N/A") for any field you cannot determine.`

function extractJson(text: string): string {
	const trimmed = text.trim()
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
	if (fenced) return fenced[1].trim()
	const start = trimmed.indexOf("{")
	const end = trimmed.lastIndexOf("}")
	if (start !== -1 && end !== -1 && end > start) {
		return trimmed.slice(start, end + 1)
	}
	return trimmed
}

export async function POST(request: Request) {
	await requireSession()

	const formData = await request.formData()
	const file = formData.get("image")

	if (!file || !(file instanceof File)) {
		return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 })
	}

	if (!file.type.startsWith("image/")) {
		return NextResponse.json({ error: "INVALID_TYPE" }, { status: 415 })
	}

	if (file.size > 5 * 1024 * 1024) {
		return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 })
	}

	const buffer = await file.arrayBuffer()
	const imageData = new Uint8Array(buffer)

	const { text } = await generateText({
		model: moonshotai("moonshot-v1-8k-vision-preview"),
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{
				role: "user",
				content: [
					{ type: "image", image: imageData },
					{
						type: "text",
						text: "Extract the receipt data. Respond with the JSON object only.",
					},
				],
			},
		],
	})

	try {
		const parsed = JSON.parse(extractJson(text))
		const result = receiptSchema.parse(parsed)
		return NextResponse.json(result)
	} catch {
		return NextResponse.json({ error: "PARSE_FAILED" }, { status: 422 })
	}
}
