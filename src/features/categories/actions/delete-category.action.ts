"use server";

import { revalidatePath } from "next/cache";

import { CategoryScope } from "@/generated/prisma/enums";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const session = await requireSession();

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category.scope === CategoryScope.SYSTEM) {
      return { success: false, error: "Cannot delete system categories" };
    }

    if (category.userId !== session.user.id) {
      return {
        success: false,
        error: "You can only delete your own categories",
      };
    }

    if (category._count.transactions > 0) {
      return {
        success: false,
        error:
          "Cannot delete a category with existing transactions. Reassign them first.",
      };
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error:
          "Cannot delete a category with subcategories. Delete them first.",
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/categories");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
