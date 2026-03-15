"use server";

import { revalidatePath } from "next/cache";

import { CategoryScope } from "@/generated/prisma/enums";
import { createCategorySchema } from "@/features/categories/lib/categories.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    transactionType: formData.get("transactionType"),
    isRecurring: formData.get("isRecurring"),
    isAvoidable: formData.get("isAvoidable"),
    alertThreshold: formData.get("alertThreshold"),
    currencyCode: formData.get("currencyCode") || "USD",
    parentId: formData.get("parentId") || undefined,
  };

  const result = createCategorySchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, icon, color, transactionType, isRecurring, isAvoidable, alertThreshold, parentId } =
    result.data;

  const session = await requireSession();

  try {
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return { success: false, error: "Parent category not found" };
      }

      if (parent.parentId !== null) {
        return {
          success: false,
          error: "Cannot nest more than 2 levels deep",
        };
      }
    }

    await prisma.category.create({
      data: {
        name,
        icon,
        color,
        transactionType,
        isRecurring,
        isAvoidable,
        alertThreshold: alertThreshold ?? null,
        parentId: parentId ?? null,
        scope: CategoryScope.USER,
        userId: session.user.id,
      },
    });

    revalidatePath("/categories");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to create category" };
  }
}
