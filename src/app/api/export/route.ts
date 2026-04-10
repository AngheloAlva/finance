import { NextResponse } from "next/server"

import { generateTransactionsCsv } from "@/features/export/lib/csv-generator"
import { exportFiltersSchema } from "@/features/export/lib/export.schema"
import { getTransactions } from "@/features/transactions/lib/transactions.queries"
import { requireSession } from "@/shared/lib/auth"
import type { CurrencyCode } from "@/shared/lib/constants"

export async function GET(request: Request) {
	const session = await requireSession()
	const currency = (session.user.currency ?? "USD") as CurrencyCode

	const { searchParams } = new URL(request.url)
	const rawFilters = {
		dateFrom: searchParams.get("dateFrom") || undefined,
		dateTo: searchParams.get("dateTo") || undefined,
		type: searchParams.get("type") || undefined,
		categoryId: searchParams.get("categoryId") || undefined,
		tagId: searchParams.get("tagId") || undefined,
	}

	const result = exportFiltersSchema.safeParse(rawFilters)
	if (!result.success) {
		return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 })
	}

	// Fetch all matching transactions (no pagination for export)
	const { data } = await getTransactions(
		session.user.id,
		result.data,
		{ page: 1, pageSize: 10000 },
	)

	const csv = generateTransactionsCsv(data, currency)

	const timestamp = new Date().toISOString().split("T")[0]
	const filename = `transactions-${timestamp}.csv`

	return new NextResponse(csv, {
		status: 200,
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${filename}"`,
		},
	})
}
