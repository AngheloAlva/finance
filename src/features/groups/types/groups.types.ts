import type { Group, GroupInvitation, GroupMember } from "@/generated/prisma/client"
import type { GroupRole } from "@/generated/prisma/enums"

export interface GroupMemberUser {
	id: string
	name: string
	email: string
	image: string | null
}

export interface GroupInviterUser {
	id: string
	name: string
	email: string
}

export interface GroupWithMemberCount extends Group {
	memberCount: number
	currentUserRole: GroupRole
}

export interface GroupMemberWithUser extends GroupMember {
	user: GroupMemberUser
}

export interface GroupInvitationWithInviter extends GroupInvitation {
	invitedBy: GroupInviterUser
}

export interface GroupDetail extends Group {
	members: GroupMemberWithUser[]
	invitations: GroupInvitationWithInviter[]
	memberCount: number
}
