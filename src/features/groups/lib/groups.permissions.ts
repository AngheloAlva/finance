import type { GroupMember } from "@/generated/prisma/client"
import type { GroupRole } from "@/generated/prisma/enums"

import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export {
	canManageMembers,
	canManageCategories,
	canDeleteGroup,
	canChangeRoles,
	canRemoveMember,
	canManageGoals,
	canContributeToGoals,
} from "@/features/groups/lib/groups.permissions.shared"

export async function getGroupMembership(
	userId: string,
	groupId: string
): Promise<GroupMember | null> {
	return prisma.groupMember.findUnique({
		where: { userId_groupId: { userId, groupId } },
	})
}

export async function assertGroupRole(
	userId: string,
	groupId: string,
	...requiredRoles: GroupRole[]
): Promise<ActionResult<GroupMember>> {
	const membership = await getGroupMembership(userId, groupId)

	if (!membership) {
		return { success: false, error: "GROUP_NOT_MEMBER" }
	}

	if (!requiredRoles.includes(membership.role)) {
		return {
			success: false,
			error: "GROUP_PERMISSION_DENIED",
		}
	}

	return { success: true, data: membership }
}
