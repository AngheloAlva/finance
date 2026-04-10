"use server"

import { revalidatePath } from "next/cache"

import { updateTagSchema } from "@/features/tags/lib/tags.schema"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function updateTagAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const raw = {
		id: formData.get("id"),
		name: formData.get("name"),
		color: formData.get("color") || undefined,
	}

	const result = updateTagSchema.safeParse(raw)
	if (!result.success) return formatZodErrors(result.error)

	const { id, name, color } = result.data
	const session = await requireSession()

	try {
		const existing = await prisma.tag.findUnique({ where: { id } })

		if (!existing) return { success: false, error: "TAG_NOT_FOUND" }
		if (existing.userId !== session.user.id) return { success: false, error: "TAG_NOT_OWNED" }

		await prisma.tag.update({
			where: { id },
			data: { name, color },
		})

		revalidatePath("/transactions")

		return { success: true, data: undefined }
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return { success: false, error: "TAG_ALREADY_EXISTS" }
		}
		return { success: false, error: "TAG_UPDATE_FAILED" }
	}
}
