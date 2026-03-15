import { z } from "zod";

import { parseCurrencyInput } from "@/shared/lib/formatters";
import type { CurrencyCode } from "@/shared/lib/constants";

export const affordabilityInputSchema = z
  .object({
    purchaseAmount: z.string().min(1, { error: "Amount is required" }),
    currencyCode: z.string().default("USD"),
    installments: z.coerce
      .number()
      .int()
      .min(1, { error: "Minimum 1 installment" })
      .max(48, { error: "Maximum 48 installments" })
      .default(1),
    creditCardId: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    purchaseAmount: parseCurrencyInput(data.purchaseAmount, data.currencyCode as CurrencyCode),
  }))
  .pipe(
    z.object({
      purchaseAmount: z.number().int().positive({ error: "Amount must be greater than zero" }),
      currencyCode: z.string(),
      installments: z.number().int(),
      creditCardId: z.string().optional(),
    }),
  );

export const savingsGoalInputSchema = z.object({
  goalId: z.string().min(1, { error: "Please select a goal" }),
  adjustedMonthlyContribution: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      const cleaned = val.replace(/[^0-9.-]/g, "");
      const parsed = parseFloat(cleaned);
      if (Number.isNaN(parsed)) return undefined;
      return Math.round(parsed * 100);
    })
    .pipe(z.number().int().nonnegative().optional()),
});

export const debtPayoffInputSchema = z.object({
  extraPayment: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      const cleaned = val.replace(/[^0-9.-]/g, "");
      const parsed = parseFloat(cleaned);
      if (Number.isNaN(parsed)) return undefined;
      return Math.round(parsed * 100);
    })
    .pipe(z.number().int().nonnegative().optional()),
});

export const incomeChangeInputSchema = z.object({
  changePercent: z.coerce
    .number()
    .min(-100, { error: "Cannot decrease by more than 100%" })
    .max(1000, { error: "Maximum 1000% increase" }),
});

export const budgetOptimizerInputSchema = z.object({
  targetSavings: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      const cleaned = val.replace(/[^0-9.-]/g, "");
      const parsed = parseFloat(cleaned);
      if (Number.isNaN(parsed)) return undefined;
      return Math.round(parsed * 100);
    })
    .pipe(z.number().int().nonnegative().optional()),
});

export type AffordabilityInputParsed = z.infer<typeof affordabilityInputSchema>;
export type SavingsGoalInputParsed = z.infer<typeof savingsGoalInputSchema>;
export type DebtPayoffInputParsed = z.infer<typeof debtPayoffInputSchema>;
export type IncomeChangeInputParsed = z.infer<typeof incomeChangeInputSchema>;
export type BudgetOptimizerInputParsed = z.infer<typeof budgetOptimizerInputSchema>;
