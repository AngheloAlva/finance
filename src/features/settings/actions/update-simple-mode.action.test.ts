import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}))
vi.mock("@/shared/lib/auth", () => ({
	requireSession: vi.fn(),
	getSession: vi.fn(),
}))

import { revalidatePath } from "next/cache"

import { updateSimpleModeAction } from "@/features/settings/actions/update-simple-mode.action"
import { prisma } from "@/shared/lib/prisma"
import { createUser } from "../../../../tests/helpers/factories"
import { setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
	vi.clearAllMocks()
})

describe("updateSimpleModeAction", () => {
	it("starts new accounts in simple mode", async () => {
		const user = await createUser()
		expect(user.simpleMode).toBe(true)
	})

	it("turns simple mode off and on for the signed-in user only", async () => {
		const user = await createUser()
		const other = await createUser()
		setSessionUser(user.id)

		expect(await updateSimpleModeAction(false)).toEqual({ success: true, data: undefined })
		expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).simpleMode).toBe(false)
		expect((await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).simpleMode).toBe(true)
		expect(revalidatePath).toHaveBeenCalledWith("/", "layout")

		await updateSimpleModeAction(true)
		expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).simpleMode).toBe(true)
	})
})
