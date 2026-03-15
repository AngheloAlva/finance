import { z } from "zod";

import { CURRENCIES, TIMEZONES } from "@/shared/lib/constants";

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const timezoneValues = TIMEZONES.map((t) => t.value) as [string, ...string[]];

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(50, { error: "Name must be at most 50 characters" }),
  image: z
    .union([z.url({ error: "Must be a valid URL" }), z.literal("")])
    .optional(),
  currency: z.enum(currencyCodes, {
    error: "Please select a valid currency",
  }),
  timezone: z.enum(timezoneValues, {
    error: "Please select a valid timezone",
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
