import { moonshotai } from "@ai-sdk/moonshotai"
import { NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"

import { requireSession } from "@/shared/lib/auth"

const receiptSchema = z.object({
	amount: z.number().nullable().describe("Total amount as a decimal number (e.g. 12.50). Null if not found."),
	description: z.string().nullable().describe("Merchant name or brief item description. Null if not found."),
	date: z.string().nullable().describe("Date in YYYY-MM-DD format. Null if not found."),
	paymentMethod: z
		.enum(["CASH", "DEBIT", "CREDIT", "TRANSFER", "OTHER"])
		.nullable()
		.describe("Payment method if visible. Null if not found."),
})

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

	const { output } = await generateText({
		model: moonshotai("moonshot-v1-8k"),
		output: Output.object({ schema: receiptSchema }),
		messages: [
			{
				role: "user",
				content: [
					{ type: "image", image: imageData },
					{
						type: "text",
						text: "Extract the following from this receipt or screenshot: total amount, merchant/description, date, and payment method. Return null for any field you cannot find. For amount, return just the number (no currency symbol).",
					},
				],
			},
		],
	})

	return NextResponse.json(output)
}
