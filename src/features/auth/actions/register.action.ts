"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/features/auth/lib/auth.config";
import { formatZodErrors } from "@/shared/lib/action-utils";
import type { ActionResult } from "@/shared/types/common.types";

const registerSchema = z
  .object({
    name: z.string().min(2, { error: "minLength2" }),
    email: z.email({ error: "invalidEmail" }),
    password: z
      .string()
      .min(8, { error: "minLength8" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const result = registerSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, email, password } = result.data;

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch {
    return {
      success: false,
      error: "AUTH_REGISTER_FAILED",
    };
  }

  redirect("/");
}
