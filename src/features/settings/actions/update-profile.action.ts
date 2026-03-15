"use server";

import { revalidatePath } from "next/cache";

import { updateProfileSchema } from "@/features/settings/lib/settings.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateProfileAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    image: formData.get("image"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  };

  const result = updateProfileSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, image, currency, timezone } = result.data;

  const session = await requireSession();

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image: image === "" ? null : image ?? undefined,
        currency,
        timezone,
      },
    });

    revalidatePath("/settings");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}
