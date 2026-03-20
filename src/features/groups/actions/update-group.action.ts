"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { updateGroupSchema } from "@/features/groups/lib/groups.schema";
import { assertGroupRole } from "@/features/groups/lib/groups.permissions";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function updateGroupAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    currency: formData.get("currency"),
  };

  const result = updateGroupSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { id, name, description, currency } = result.data;

  const session = await requireSession();

  const permission = await assertGroupRole(session.user.id, id, GroupRole.OWNER, GroupRole.ADMIN);

  if (!permission.success) {
    return { success: false, error: permission.error };
  }

  try {
    await prisma.group.update({
      where: { id },
      data: { name, description, currency },
    });

    revalidatePath("/groups");
    revalidatePath(`/groups/${id}`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GROUP_UPDATE_FAILED" };
  }
}
