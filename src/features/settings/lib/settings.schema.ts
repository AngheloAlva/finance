import { z } from "zod";

import { CURRENCIES, TIMEZONES } from "@/shared/lib/constants";

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const timezoneValues = TIMEZONES.map((t) => t.value) as [string, ...string[]];

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "minLength2" })
    .max(50, { error: "maxLength50" }),
  image: z
    .union([z.url({ error: "invalidUrl" }), z.literal("")])
    .optional(),
  currency: z.enum(currencyCodes, {
    error: "invalidCurrency",
  }),
  timezone: z.enum(timezoneValues, {
    error: "invalidTimezone",
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
