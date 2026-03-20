"use server";

import { revalidatePath } from "next/cache";

import { CategoryScope } from "@/generated/prisma/enums";
import { updateCategorySchema } from "@/features/categories/lib/categories.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
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

  const result = updateCategorySchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, name, icon, color, transactionType, isRecurring, isAvoidable, alertThreshold, parentId } =
    result.data;

  const session = await requireSession();

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "CATEGORY_NOT_FOUND" };
    }

    if (existing.scope === CategoryScope.SYSTEM) {
      return { success: false, error: "CATEGORY_SYSTEM_IMMUTABLE" };
    }

    if (existing.userId !== session.user.id) {
      return { success: false, error: "CATEGORY_NOT_OWNED" };
    }

    if (parentId) {
      if (parentId === id) {
        return {
          success: false,
          error: "CATEGORY_SELF_PARENT",
        };
      }

      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return { success: false, error: "CATEGORY_PARENT_NOT_FOUND" };
      }

      if (parent.parentId !== null) {
        return {
          success: false,
          error: "CATEGORY_NESTING_TOO_DEEP",
        };
      }
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        icon,
        color,
        transactionType,
        isRecurring,
        isAvoidable,
        alertThreshold: alertThreshold ?? null,
        parentId: parentId ?? null,
      },
    });

    revalidatePath("/categories");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "CATEGORY_UPDATE_FAILED" };
  }
}
