import { z } from "zod";

export const createCreditCardSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(50, { error: "Name must be at most 50 characters" }),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, { error: "Must be exactly 4 digits" }),
  brand: z
    .string()
    .min(1, { error: "Brand is required" })
    .max(30, { error: "Brand must be at most 30 characters" }),
  totalLimit: z.coerce
    .number()
    .int({ error: "Limit must be a valid number" })
    .positive({ error: "Limit must be greater than zero" }),
  closingDay: z.coerce
    .number()
    .int({ error: "Closing day must be a whole number" })
    .min(1, { error: "Closing day must be between 1 and 31" })
    .max(31, { error: "Closing day must be between 1 and 31" }),
  paymentDay: z.coerce
    .number()
    .int({ error: "Payment day must be a whole number" })
    .min(1, { error: "Payment day must be between 1 and 31" })
    .max(31, { error: "Payment day must be between 1 and 31" }),
  color: z.string().min(1, { error: "Color is required" }),
});

export const updateCreditCardSchema = createCreditCardSchema.extend({
  id: z.string().min(1, { error: "Credit card ID is required" }),
});

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
