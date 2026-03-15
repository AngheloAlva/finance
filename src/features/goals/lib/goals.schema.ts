import { z } from "zod";

export const createGoalSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(100, { error: "Name must be at most 100 characters" }),
  description: z
    .string()
    .max(500, { error: "Description must be at most 500 characters" })
    .optional(),
  targetAmount: z.coerce
    .number()
    .int({ error: "Amount must be a valid number" })
    .positive({ error: "Amount must be greater than zero" }),
  targetDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  groupId: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().min(1, { error: "Goal ID is required" }),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const addContributionSchema = z.object({
  goalId: z.string().min(1, { error: "Goal ID is required" }),
  amount: z.coerce
    .number()
    .int({ error: "Amount must be a valid number" })
    .positive({ error: "Amount must be greater than zero" }),
  date: z
    .string()
    .min(1, { error: "Date is required" })
    .transform((val) => new Date(val)),
  note: z
    .string()
    .max(200, { error: "Note must be at most 200 characters" })
    .optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;
