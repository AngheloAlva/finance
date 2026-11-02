import { localizeCategories } from "@/features/categories/lib/system-categories";
import type { Category } from "@/generated/prisma/client";
import { CategoryScope } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function getUserCategories(userId: string, locale: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });

  const userGroupIds = memberships.map((m) => m.groupId);

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { scope: CategoryScope.SYSTEM },
        { scope: CategoryScope.USER, userId },
        ...(userGroupIds.length > 0
          ? [{ scope: "GROUP" as const, groupId: { in: userGroupIds } }]
          : []),
      ],
    },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
  });

  return localizeCategories(categories, locale);
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function assertCategoryAccess(
  categoryId: string,
  userId: string,
): Promise<ActionResult<Category>> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { success: false, error: "CATEGORY_NOT_FOUND" };
  }

  if (category.scope !== CategoryScope.SYSTEM && category.userId !== userId) {
    return { success: false, error: "CATEGORY_ACCESS_DENIED" };
  }

  return { success: true, data: category };
}
