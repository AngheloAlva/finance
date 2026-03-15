"use client"

import { GroupRole } from "@/generated/prisma/enums"

import { Badge } from "@/components/ui/badge"
import { RemoveMemberButton } from "@/features/groups/components/remove-member-button"
import { RoleSelect } from "@/features/groups/components/role-select"
import {
	canManageMembers,
	canChangeRoles,
	canRemoveMember,
} from "@/features/groups/lib/groups.permissions.shared"
import type { GroupMemberWithUser } from "@/features/groups/types/groups.types"

interface MemberListProps {
	members: GroupMemberWithUser[]
	currentUserRole: GroupRole
	groupId: string
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
	OWNER: "default",
	ADMIN: "secondary",
	MEMBER: "outline",
}

export function MemberList({ members, currentUserRole, groupId }: MemberListProps) {
	const showActions = canManageMembers(currentUserRole)
	const showRoleChange = canChangeRoles(currentUserRole)

	return (
		<div className="flex flex-col gap-2">
			{members.map((member) => (
				<div
					key={member.id}
					className="flex items-center justify-between rounded-none border px-3 py-2"
				>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs font-medium">{member.user.name ?? member.user.email}</span>
						<span className="text-muted-foreground text-xs">{member.user.email}</span>
					</div>
					<div className="flex items-center gap-2">
						{showRoleChange && member.role !== GroupRole.OWNER ? (
							<RoleSelect groupId={groupId} memberId={member.id} currentRole={member.role} />
						) : (
							<Badge variant={ROLE_VARIANT[member.role] ?? "outline"}>{member.role}</Badge>
						)}
						{showActions && canRemoveMember(currentUserRole, member.role) && (
							<RemoveMemberButton
								groupId={groupId}
								memberId={member.id}
								memberName={member.user.name ?? member.user.email}
							/>
						)}
					</div>
				</div>
			))}
		</div>
	)
}
