import { z } from "zod";

export const createCreditCardSchema = z.object({
  name: z
    .string()
    .min(1, { error: "required" })
    .max(50, { error: "maxLength50" }),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, { error: "exactDigits4" }),
  brand: z
    .string()
    .min(1, { error: "required" })
    .max(30, { error: "maxLength30" }),
  totalLimit: z.coerce
    .number()
    .int({ error: "invalidNumber" })
    .positive({ error: "positive" }),
  closingDay: z.coerce
    .number()
    .int({ error: "wholeNumber" })
    .min(1, { error: "dayRange" })
    .max(31, { error: "dayRange" }),
  paymentDay: z.coerce
    .number()
    .int({ error: "wholeNumber" })
    .min(1, { error: "dayRange" })
    .max(31, { error: "dayRange" }),
  color: z.string().min(1, { error: "required" }),
});

export const updateCreditCardSchema = createCreditCardSchema.extend({
  id: z.string().min(1, { error: "requiredId" }),
});

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
