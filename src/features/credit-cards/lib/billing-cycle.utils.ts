/**
 * Billing cycle utilities for credit card statement date computation.
 *
 * All functions are pure — no side effects, no DB calls.
 * Month values follow JS Date convention: 0-indexed (0 = January, 11 = December).
 */

interface StatementDates {
  cycleStart: Date;
  cycleEnd: Date;
  paymentDueDate: Date;
}

/**
 * Clamp a day number to the last valid day of the given month.
 * Handles Feb 28/29, months with 30 days, etc.
 *
 * @param day - The desired day (1-31)
 * @param year - Full year (e.g. 2026)
 * @param month - 0-indexed month (0 = Jan, 11 = Dec)
 */
export function clampDay(day: number, year: number, month: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

/**
 * Compute statement cycle dates for a credit card given a reference date.
 *
 * Logic:
 * - If referenceDate's day <= clamped closing day → falls in current month's cycle
 * - If referenceDate's day > clamped closing day → falls in next month's cycle
 * - cycleStart = day after previous month's closing
 * - cycleEnd = closing day of the determined cycle month
 * - paymentDueDate = payment day in month after closing
 *
 * @param closingDay - Card's statement closing day (1-31)
 * @param paymentDay - Card's payment due day (1-31)
 * @param referenceDate - The date to determine which cycle it falls into
 */
export function computeStatementDates(
  closingDay: number,
  paymentDay: number,
  referenceDate: Date,
): StatementDates {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const clampedClosing = clampDay(closingDay, refYear, refMonth);

  let cycleEndMonth: number;
  let cycleEndYear: number;

  if (refDay <= clampedClosing) {
    // Transaction falls in current month's cycle
    cycleEndMonth = refMonth;
    cycleEndYear = refYear;
  } else {
    // Transaction falls in next month's cycle
    cycleEndMonth = refMonth + 1;
    cycleEndYear = refYear;
    if (cycleEndMonth > 11) {
      cycleEndMonth = 0;
      cycleEndYear++;
    }
  }

  const cycleEnd = new Date(
    cycleEndYear,
    cycleEndMonth,
    clampDay(closingDay, cycleEndYear, cycleEndMonth),
  );

  // Cycle start = day after previous month's closing
  const prevMonth = cycleEndMonth - 1;
  const prevYear = prevMonth < 0 ? cycleEndYear - 1 : cycleEndYear;
  const normalizedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
  const prevClosing = clampDay(closingDay, prevYear, normalizedPrevMonth);
  const cycleStart = new Date(prevYear, normalizedPrevMonth, prevClosing + 1);

  // Payment due date: paymentDay in the month after closing
  let paymentMonth = cycleEndMonth + 1;
  let paymentYear = cycleEndYear;
  if (paymentMonth > 11) {
    paymentMonth = 0;
    paymentYear++;
  }
  const paymentDueDate = new Date(
    paymentYear,
    paymentMonth,
    clampDay(paymentDay, paymentYear, paymentMonth),
  );

  return { cycleStart, cycleEnd, paymentDueDate };
}

/**
 * Compute the impact date for a specific installment of a credit card purchase.
 *
 * First installment (index 0) lands on the payment date of the cycle the purchase
 * falls into. Subsequent installments add months to that payment date.
 *
 * @param closingDay - Card's statement closing day (1-31)
 * @param paymentDay - Card's payment due day (1-31)
 * @param purchaseDate - The date the purchase was made
 * @param installmentIndex - 0-based installment index
 */
export function getInstallmentImpactDate(
  closingDay: number,
  paymentDay: number,
  purchaseDate: Date,
  installmentIndex: number,
): Date {
  const firstCycle = computeStatementDates(closingDay, paymentDay, purchaseDate);

  const paymentMonth =
    firstCycle.paymentDueDate.getMonth() + installmentIndex;
  const paymentYear =
    firstCycle.paymentDueDate.getFullYear() + Math.floor(paymentMonth / 12);
  const normalizedMonth = ((paymentMonth % 12) + 12) % 12;

  return new Date(
    paymentYear,
    normalizedMonth,
    clampDay(paymentDay, paymentYear, normalizedMonth),
  );
}

/**
 * Get the current open billing cycle range for a credit card.
 * Used for computing the card's used limit (sum of expenses in this range).
 *
 * @param closingDay - Card's statement closing day (1-31)
 * @param paymentDay - Card's payment due day (1-31)
 */
export function getCurrentCycleRange(
  closingDay: number,
  paymentDay: number,
): { start: Date; end: Date } {
  const today = new Date();
  const dates = computeStatementDates(closingDay, paymentDay, today);
  return { start: dates.cycleStart, end: dates.cycleEnd };
}
