import { CategoryScope, InvitationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";

import type {
  GroupDetail,
  GroupInvitationWithInviter,
  GroupMemberWithUser,
  GroupWithMemberCount,
} from "@/features/groups/types/groups.types";

export async function getUserGroups(
  userId: string,
): Promise<GroupWithMemberCount[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    ...membership.group,
    memberCount: membership.group._count.members,
    currentUserRole: membership.role,
  }));
}

export async function getGroupById(
  groupId: string,
): Promise<GroupDetail | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      invitations: {
        where: { status: InvitationStatus.PENDING },
        include: {
          invitedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) return null;

  return {
    ...group,
    memberCount: group._count.members,
  };
}

export async function getGroupMembers(
  groupId: string,
): Promise<GroupMemberWithUser[]> {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getGroupInvitations(
  groupId: string,
): Promise<GroupInvitationWithInviter[]> {
  return prisma.groupInvitation.findMany({
    where: { groupId, status: InvitationStatus.PENDING },
    include: {
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGroupCategories(groupId: string) {
  return prisma.category.findMany({
    where: {
      scope: CategoryScope.GROUP,
      groupId,
    },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getInvitationByToken(token: string) {
  return prisma.groupInvitation.findUnique({
    where: { token },
    include: {
      group: {
        select: { id: true, name: true, description: true },
      },
    },
  });
}
