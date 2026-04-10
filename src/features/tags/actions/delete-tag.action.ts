"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function deleteTagAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const id = formData.get("id") as string | null
	if (!id) return { success: false, error: "TAG_NOT_FOUND" }

	const session = await requireSession()

	try {
		const existing = await prisma.tag.findUnique({ where: { id } })

		if (!existing) return { success: false, error: "TAG_NOT_FOUND" }
		if (existing.userId !== session.user.id) return { success: false, error: "TAG_NOT_OWNED" }

		await prisma.tag.delete({ where: { id } })

		revalidatePath("/transactions")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "TAG_DELETE_FAILED" }
	}
}
