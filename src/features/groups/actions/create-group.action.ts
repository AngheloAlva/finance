"use server";

import { revalidatePath } from "next/cache";

import { GroupRole } from "@/generated/prisma/enums";
import { createGroupSchema } from "@/features/groups/lib/groups.schema";
import { formatZodErrors } from "@/shared/lib/action-utils";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { ActionResult } from "@/shared/types/common.types";

export async function createGroupAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    currency: formData.get("currency"),
  };

  const result = createGroupSchema.safeParse(raw);

  if (!result.success) {
    return formatZodErrors(result.error);
  }

  const { name, description, currency } = result.data;

  const session = await requireSession();

  try {
    await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: { name, description, currency },
      });

      await tx.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: group.id,
          role: GroupRole.OWNER,
        },
      });
    });

    revalidatePath("/groups");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "GROUP_CREATE_FAILED" };
  }
}
