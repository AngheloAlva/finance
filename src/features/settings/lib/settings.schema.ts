import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "minLength2" })
    .max(50, { error: "maxLength50" }),
  image: z
    .union([z.url({ error: "invalidUrl" }), z.literal("")])
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
