"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/features/auth/lib/auth.config";
import { formatZodErrors } from "@/shared/lib/action-utils";
import type { ActionResult } from "@/shared/types/common.types";

const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" }),
});

export async function loginAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = loginSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { email, password } = result.data;

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch {
    return {
      success: false,
      error: "Invalid credentials",
    };
  }

  redirect("/");
}
