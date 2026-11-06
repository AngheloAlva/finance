"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

/** Turns simple mode (everyday sections only) on or off for the signed-in user. */
export async function updateSimpleModeAction(simpleMode: boolean): Promise<ActionResult<void>> {
	const session = await requireSession()

	try {
		await prisma.user.update({
			where: { id: session.user.id },
			data: { simpleMode: simpleMode === true },
		})
	} catch {
		return { success: false, error: "PROFILE_UPDATE_FAILED" }
	}

	// The navigation lives in the dashboard layout.
	revalidatePath("/", "layout")
	return { success: true, data: undefined }
}
