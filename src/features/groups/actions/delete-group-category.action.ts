"use server";

import { revalidatePath } from "next/cache";

import { CategoryScope, GroupRole } from "@/generated/prisma/enums";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { requireFormId } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function deleteGroupCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const idResult = requireFormId(formData);
  if (!idResult.success) return idResult;
  const id = idResult.data;

  const groupIdResult = requireFormId(formData, "groupId");
  if (!groupIdResult.success) return groupIdResult;
  const groupId = groupIdResult.data;

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
      return { success: false, error: "CATEGORY_NOT_FOUND" };
    }

    if (category.scope !== CategoryScope.GROUP || category.groupId !== groupId) {
      return {
        success: false,
        error: "CATEGORY_WRONG_GROUP",
      };
    }

    if (category._count.transactions > 0) {
      return {
        success: false,
        error: "CATEGORY_DELETE_HAS_TRANSACTIONS",
      };
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error: "CATEGORY_DELETE_HAS_CHILDREN",
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath(`/groups/${groupId}/categories`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "CATEGORY_DELETE_FAILED" };
  }
}
