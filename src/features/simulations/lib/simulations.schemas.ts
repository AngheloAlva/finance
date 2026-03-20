import { z } from "zod";

import { parseCurrencyInput } from "@/shared/lib/formatters";
import type { CurrencyCode } from "@/shared/lib/constants";

export const affordabilityInputSchema = z
  .object({
    purchaseAmount: z.string().min(1, { error: "required" }),
    currencyCode: z.string().default("USD"),
    installments: z.coerce
      .number()
      .int()
      .min(1, { error: "minInstallments1" })
      .max(48, { error: "maxInstallments48" })
      .default(1),
    creditCardId: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    purchaseAmount: parseCurrencyInput(data.purchaseAmount, data.currencyCode as CurrencyCode),
  }))
  .pipe(
    z.object({
      purchaseAmount: z.number().int().positive({ error: "positive" }),
      currencyCode: z.string(),
      installments: z.number().int(),
      creditCardId: z.string().optional(),
    }),
  );

export const savingsGoalInputSchema = z.object({
  goalId: z.string().min(1, { error: "required" }),
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
    .min(-100, { error: "minPercent100" })
    .max(1000, { error: "maxPercent1000" }),
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
