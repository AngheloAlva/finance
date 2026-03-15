/**
 * Installment row generation utility.
 *
 * Generates N physical transaction rows for an installment purchase.
 * Amount splitting uses floor division for first N-1 rows, remainder for the last.
 * This guarantees the sum of all rows equals the original total — no rounding drift.
 */

import type { PaymentMethod, TransactionType } from "@/generated/prisma/enums"

import { getInstallmentImpactDate } from "@/features/credit-cards/lib/billing-cycle.utils"

interface InstallmentInput {
	totalAmount: number
	totalInstallments: number
	description: string
	notes: string | null
	date: Date
	type: TransactionType
	paymentMethod: PaymentMethod
	categoryId: string
	userId: string
	creditCardId?: string
	closingDay?: number
	paymentDay?: number
}

interface InstallmentRow {
	amount: number
	description: string
	notes: string | null
	date: Date
	impactDate: Date
	type: TransactionType
	paymentMethod: PaymentMethod
	categoryId: string
	userId: string
	creditCardId: string | null
	installmentNumber: number
	totalInstallments: number
}

/**
 * Generate N installment transaction rows from a single purchase.
 *
 * Amount splitting:
 *   baseAmount = Math.floor(totalAmount / totalInstallments)
 *   remainder  = totalAmount - baseAmount * (totalInstallments - 1)
 *   Last installment gets the remainder.
 *
 * Impact date:
 *   If creditCardId + closingDay + paymentDay are provided, uses billing cycle
 *   computation via getInstallmentImpactDate.
 *   Otherwise, adds i months to the purchase date (capped at day 28 to avoid
 *   month-end overflow).
 */
function generateInstallmentRows(input: InstallmentInput): InstallmentRow[] {
	const {
		totalAmount,
		totalInstallments,
		description,
		notes,
		date,
		type,
		paymentMethod,
		categoryId,
		userId,
		creditCardId,
		closingDay,
		paymentDay,
	} = input

	const baseAmount = Math.floor(totalAmount / totalInstallments)
	const remainder = totalAmount - baseAmount * (totalInstallments - 1)

	const rows: InstallmentRow[] = []

	for (let i = 0; i < totalInstallments; i++) {
		const amount = i === totalInstallments - 1 ? remainder : baseAmount
		const installmentNumber = i + 1

		let impactDate: Date
		if (creditCardId && closingDay !== undefined && paymentDay !== undefined) {
			impactDate = getInstallmentImpactDate(closingDay, paymentDay, date, i)
		} else {
			// Non-credit-card: add i months to purchase date
			const m = date.getMonth() + i
			const y = date.getFullYear() + Math.floor(m / 12)
			const normalizedMonth = ((m % 12) + 12) % 12
			impactDate = new Date(y, normalizedMonth, Math.min(date.getDate(), 28))
		}

		rows.push({
			amount,
			description: `${description} (${installmentNumber}/${totalInstallments})`,
			notes,
			date,
			impactDate,
			type,
			paymentMethod,
			categoryId,
			userId,
			creditCardId: creditCardId ?? null,
			installmentNumber,
			totalInstallments,
		})
	}

	return rows
}

export { generateInstallmentRows }
export type { InstallmentInput, InstallmentRow }
