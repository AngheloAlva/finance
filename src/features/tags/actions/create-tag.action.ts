"use server"

import { revalidatePath } from "next/cache"

import { createTagSchema } from "@/features/tags/lib/tags.schema"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function createTagAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const raw = {
		name: formData.get("name"),
		color: formData.get("color") || undefined,
	}

	const result = createTagSchema.safeParse(raw)
	if (!result.success) return formatZodErrors(result.error)

	const { name, color } = result.data
	const session = await requireSession()

	try {
		await prisma.tag.create({
			data: {
				name,
				color,
				userId: session.user.id,
			},
		})

		revalidatePath("/transactions")

		return { success: true, data: undefined }
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return { success: false, error: "TAG_ALREADY_EXISTS" }
		}
		return { success: false, error: "TAG_CREATE_FAILED" }
	}
}
