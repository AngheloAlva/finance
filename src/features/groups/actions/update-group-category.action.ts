"use server";

import { revalidatePath } from "next/cache";

import { CategoryScope, GroupRole } from "@/generated/prisma/enums";
import { updateCategorySchema } from "@/features/categories/lib/categories.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateGroupCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const groupId = formData.get("groupId");

  if (typeof groupId !== "string" || groupId.length === 0) {
    return { success: false, error: "Group ID is required" };
  }

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

  const session = await requireSession();

  const permission = await assertGroupRole(
    session.user.id,
    groupId,
    GroupRole.OWNER,
    GroupRole.ADMIN,
  );

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  const {
    id,
    name,
    icon,
    color,
    transactionType,
    isRecurring,
    isAvoidable,
    alertThreshold,
    parentId,
  } = result.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Category not found" };
    }

    if (existing.scope !== CategoryScope.GROUP || existing.groupId !== groupId) {
      return {
        success: false,
        error: "Category does not belong to this group",
      };
    }

    if (parentId) {
      if (parentId === id) {
        return {
          success: false,
          error: "A category cannot be its own parent",
        };
      }

      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return { success: false, error: "Parent category not found" };
      }

      if (parent.scope !== CategoryScope.GROUP || parent.groupId !== groupId) {
        return {
          success: false,
          error: "Parent category must belong to the same group",
        };
      }

      if (parent.parentId !== null) {
        return {
          success: false,
          error: "Cannot nest more than 2 levels deep",
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

    revalidatePath(`/groups/${groupId}/categories`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update group category" };
  }
}
