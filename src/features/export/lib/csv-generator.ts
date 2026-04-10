import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { centsToDisplay } from "@/shared/lib/formatters"

const CSV_HEADERS = [
	"Date",
	"Description",
	"Amount",
	"Type",
	"Category",
	"Payment Method",
	"Credit Card",
	"Tags",
	"Notes",
] as const

/**
 * Escapes a CSV field value: wraps in quotes if it contains commas, quotes, or newlines.
 * Doubles existing quotes inside the field.
 */
function escapeCsvField(value: string | null | undefined): string {
	if (value == null) return ""
	const stringValue = String(value)
	if (/[",\n\r]/.test(stringValue)) {
		return `"${stringValue.replace(/"/g, '""')}"`
	}
	return stringValue
}

function formatDateIso(date: Date): string {
	return date.toISOString().split("T")[0] ?? ""
}

/**
 * Generates a CSV string from transactions. Amounts are formatted as decimals
 * (e.g. 1234.56) without currency symbols to keep the file spreadsheet-friendly.
 */
export function generateTransactionsCsv(
	transactions: TransactionWithCategory[],
	currency: CurrencyCode,
): string {
	const rows: string[] = [CSV_HEADERS.join(",")]

	for (const tx of transactions) {
		const tagNames = tx.tags.map(({ tag }) => tag.name).join("; ")
		const creditCardLabel = tx.creditCard
			? `${tx.creditCard.name} *${tx.creditCard.lastFourDigits}`
			: ""

		const row = [
			formatDateIso(tx.date),
			escapeCsvField(tx.description),
			centsToDisplay(tx.amount, currency),
			tx.type,
			escapeCsvField(tx.category.name),
			tx.paymentMethod,
			escapeCsvField(creditCardLabel),
			escapeCsvField(tagNames),
			escapeCsvField(tx.notes),
		]

		rows.push(row.join(","))
	}

	return rows.join("\n")
}
