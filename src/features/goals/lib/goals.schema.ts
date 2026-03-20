import { z } from "zod";

export const createGoalSchema = z.object({
  name: z
    .string()
    .min(1, { error: "required" })
    .max(100, { error: "maxLength100" }),
  description: z
    .string()
    .max(500, { error: "maxLength500" })
    .optional(),
  targetAmount: z.coerce
    .number()
    .int({ error: "invalidNumber" })
    .positive({ error: "positive" }),
  targetDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  groupId: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().min(1, { error: "requiredId" }),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const addContributionSchema = z.object({
  goalId: z.string().min(1, { error: "requiredId" }),
  amount: z.coerce
    .number()
    .int({ error: "invalidNumber" })
    .positive({ error: "positive" }),
  date: z
    .string()
    .min(1, { error: "required" })
    .transform((val) => new Date(val)),
  note: z
    .string()
    .max(200, { error: "maxLength200" })
    .optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;
