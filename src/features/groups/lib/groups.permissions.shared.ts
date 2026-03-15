import { GroupRole } from "@/generated/prisma/enums"

export function canManageMembers(role: GroupRole): boolean {
	return role === GroupRole.OWNER || role === GroupRole.ADMIN
}

export function canManageCategories(role: GroupRole): boolean {
	return role === GroupRole.OWNER || role === GroupRole.ADMIN
}

export function canDeleteGroup(role: GroupRole): boolean {
	return role === GroupRole.OWNER
}

export function canChangeRoles(role: GroupRole): boolean {
	return role === GroupRole.OWNER
}

export function canRemoveMember(actorRole: GroupRole, targetRole: GroupRole): boolean {
	if (actorRole === GroupRole.OWNER) {
		return targetRole === GroupRole.ADMIN || targetRole === GroupRole.MEMBER
	}

	if (actorRole === GroupRole.ADMIN) {
		return targetRole === GroupRole.MEMBER
	}

	return false
}

export function canManageGoals(role: GroupRole): boolean {
	return role === GroupRole.OWNER || role === GroupRole.ADMIN
}

export function canContributeToGoals(_role: GroupRole): boolean {
	return true
}
