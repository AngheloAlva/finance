import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const e = new Error("NEXT_REDIRECT") as Error & { digest: string }
    e.digest = `NEXT_REDIRECT;replace;${url};307;`
    throw e
  }),
}))
vi.mock("@/shared/lib/auth", () => ({
  requireSession: vi.fn(),
  getSession: vi.fn(),
}))

import { createGroupAction } from "@/features/groups/actions/create-group.action"
import { updateGroupAction } from "@/features/groups/actions/update-group.action"
import { deleteGroupAction } from "@/features/groups/actions/delete-group.action"
import { inviteMemberAction } from "@/features/groups/actions/invite-member.action"
import { acceptInvitationAction } from "@/features/groups/actions/accept-invitation.action"
import { removeMemberAction } from "@/features/groups/actions/remove-member.action"
import { changeRoleAction } from "@/features/groups/actions/change-role.action"
import { createGroupCategoryAction } from "@/features/groups/actions/create-group-category.action"
import { updateGroupCategoryAction } from "@/features/groups/actions/update-group-category.action"
import { deleteGroupCategoryAction } from "@/features/groups/actions/delete-group-category.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createGroup,
  createGroupInvitation,
  createGroupMember,
  createUser,
} from "../../../../tests/helpers/factories"
import {
  expectRedirect,
  formData,
  setSessionUser,
} from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

const baseGroupCategoryFields = {
  name: "Group Food",
  icon: "fork",
  color: "#abcdef",
  transactionType: "EXPENSE",
  isRecurring: "false",
  isAvoidable: "false",
  currencyCode: "USD",
}

describe("createGroupAction", () => {
  it("creates a group and adds the session user as OWNER", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createGroupAction(
      { success: true, data: undefined },
      formData({ name: "Roomies", currency: "USD" }),
    )

    expect(result.success).toBe(true)
    const groups = await prisma.group.findMany()
    expect(groups).toHaveLength(1)
    const member = await prisma.groupMember.findFirstOrThrow({
      where: { userId: user.id, groupId: groups[0].id },
    })
    expect(member.role).toBe("OWNER")
  })
})

describe("updateGroupAction", () => {
  it("updates the group when caller is OWNER", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup({ name: "Old" })
    await createGroupMember(user.id, group.id, "OWNER")

    const result = await updateGroupAction(
      { success: true, data: undefined },
      formData({ id: group.id, name: "New", currency: "EUR" }),
    )
    expect(result.success).toBe(true)
    const updated = await prisma.group.findUniqueOrThrow({ where: { id: group.id } })
    expect(updated.name).toBe("New")
    expect(updated.currency).toBe("EUR")
  })

  it("rejects when caller is a regular MEMBER", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "MEMBER")

    const result = await updateGroupAction(
      { success: true, data: undefined },
      formData({ id: group.id, name: "Hijack", currency: "USD" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_PERMISSION_DENIED")
  })
})

describe("deleteGroupAction", () => {
  it("deletes the group when only owner is the lone member", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const result = await deleteGroupAction(
      { success: true, data: undefined },
      formData({ id: group.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.group.findUnique({ where: { id: group.id } })).toBeNull()
  })

  it("blocks deletion when other members exist", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(owner.id)
    const group = await createGroup()
    await createGroupMember(owner.id, group.id, "OWNER")
    await createGroupMember(other.id, group.id, "MEMBER")

    const result = await deleteGroupAction(
      { success: true, data: undefined },
      formData({ id: group.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_DELETE_HAS_MEMBERS")
  })
})

describe("inviteMemberAction", () => {
  it("creates a PENDING invitation when caller is OWNER", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const result = await inviteMemberAction(
      { success: true, data: { token: "" } },
      formData({ groupId: group.id, email: "new@test.local" }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.token).toBeTruthy()
    const inv = await prisma.groupInvitation.findFirstOrThrow({ where: { groupId: group.id } })
    expect(inv.status).toBe("PENDING")
    expect(inv.email).toBe("new@test.local")
  })

  it("rejects duplicate pending invitation for same email", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    await createGroupInvitation(group.id, user.id, { email: "dup@test.local" })

    const result = await inviteMemberAction(
      { success: true, data: { token: "" } },
      formData({ groupId: group.id, email: "dup@test.local" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("INVITATION_ALREADY_PENDING")
  })
})

describe("acceptInvitationAction", () => {
  it("adds the user as MEMBER and marks invitation ACCEPTED, then redirects", async () => {
    const owner = await createUser()
    const invitee = await createUser()
    setSessionUser(invitee.id)
    const group = await createGroup()
    await createGroupMember(owner.id, group.id, "OWNER")
    const inv = await createGroupInvitation(group.id, owner.id, { token: "tok-123" })

    await expectRedirect(
      acceptInvitationAction(
        { success: true, data: undefined },
        formData({ token: inv.token }),
      ),
      group.id,
    )

    const refreshed = await prisma.groupInvitation.findUniqueOrThrow({ where: { id: inv.id } })
    expect(refreshed.status).toBe("ACCEPTED")
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: invitee.id, groupId: group.id } },
    })
    expect(member?.role).toBe("MEMBER")
  })

  it("rejects an expired invitation", async () => {
    const owner = await createUser()
    const invitee = await createUser()
    setSessionUser(invitee.id)
    const group = await createGroup()
    await createGroupMember(owner.id, group.id, "OWNER")
    const inv = await createGroupInvitation(group.id, owner.id, {
      token: "tok-exp",
      expiresAt: new Date(Date.now() - 1000),
    })

    const result = await acceptInvitationAction(
      { success: true, data: undefined },
      formData({ token: inv.token }),
    )
    expect(result?.success).toBe(false)
    if (result && !result.success) expect(result.error).toBe("INVITATION_EXPIRED")
  })
})

describe("removeMemberAction", () => {
  it("removes a MEMBER when caller is OWNER", async () => {
    const owner = await createUser()
    const target = await createUser()
    setSessionUser(owner.id)
    const group = await createGroup()
    await createGroupMember(owner.id, group.id, "OWNER")
    const targetMember = await createGroupMember(target.id, group.id, "MEMBER")

    const result = await removeMemberAction(
      { success: true, data: undefined },
      formData({ groupId: group.id, memberId: targetMember.id }),
    )
    expect(result.success).toBe(true)
    expect(
      await prisma.groupMember.findUnique({ where: { id: targetMember.id } }),
    ).toBeNull()
  })
})

describe("changeRoleAction", () => {
  it("promotes a MEMBER to ADMIN when caller is OWNER", async () => {
    const owner = await createUser()
    const target = await createUser()
    setSessionUser(owner.id)
    const group = await createGroup()
    await createGroupMember(owner.id, group.id, "OWNER")
    const targetMember = await createGroupMember(target.id, group.id, "MEMBER")

    const result = await changeRoleAction(
      { success: true, data: undefined },
      formData({ groupId: group.id, memberId: targetMember.id, role: "ADMIN" }),
    )

    expect(result.success).toBe(true)
    const refreshed = await prisma.groupMember.findUniqueOrThrow({
      where: { id: targetMember.id },
    })
    expect(refreshed.role).toBe("ADMIN")
  })

  it("rejects changing the OWNER's role", async () => {
    const owner1 = await createUser()
    const owner2 = await createUser()
    setSessionUser(owner1.id)
    const group = await createGroup()
    await createGroupMember(owner1.id, group.id, "OWNER")
    const targetMember = await createGroupMember(owner2.id, group.id, "OWNER")

    const result = await changeRoleAction(
      { success: true, data: undefined },
      formData({ groupId: group.id, memberId: targetMember.id, role: "ADMIN" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MEMBER_ROLE_OWNER_IMMUTABLE")
  })
})

describe("createGroupCategoryAction", () => {
  it("creates a GROUP-scoped category when caller is OWNER/ADMIN", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "ADMIN")

    const result = await createGroupCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseGroupCategoryFields, groupId: group.id }),
    )

    expect(result.success).toBe(true)
    const cat = await prisma.category.findFirstOrThrow({
      where: { groupId: group.id },
    })
    expect(cat.scope).toBe("GROUP")
  })

  it("rejects when caller is a regular MEMBER", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "MEMBER")

    const result = await createGroupCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseGroupCategoryFields, groupId: group.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("GROUP_PERMISSION_DENIED")
  })
})

describe("updateGroupCategoryAction", () => {
  it("updates a GROUP category when caller is OWNER/ADMIN", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const cat = await prisma.category.create({
      data: {
        name: "Old",
        icon: "x",
        color: "#000000",
        scope: "GROUP",
        group: { connect: { id: group.id } },
      },
    })

    const result = await updateGroupCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseGroupCategoryFields, id: cat.id, groupId: group.id, name: "New" }),
    )
    expect(result.success).toBe(true)
    const updated = await prisma.category.findUniqueOrThrow({ where: { id: cat.id } })
    expect(updated.name).toBe("New")
  })

  it("rejects when category does not belong to the given group", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const groupA = await createGroup()
    const groupB = await createGroup()
    await createGroupMember(user.id, groupA.id, "OWNER")
    await createGroupMember(user.id, groupB.id, "OWNER")
    const cat = await prisma.category.create({
      data: {
        name: "Other",
        icon: "x",
        color: "#000000",
        scope: "GROUP",
        group: { connect: { id: groupB.id } },
      },
    })

    const result = await updateGroupCategoryAction(
      { success: true, data: undefined },
      formData({ ...baseGroupCategoryFields, id: cat.id, groupId: groupA.id, name: "New" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_WRONG_GROUP")
  })
})

describe("deleteGroupCategoryAction", () => {
  it("deletes a GROUP category with no transactions", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")
    const cat = await prisma.category.create({
      data: {
        name: "To delete",
        icon: "x",
        color: "#000000",
        scope: "GROUP",
        group: { connect: { id: group.id } },
      },
    })

    const result = await deleteGroupCategoryAction(
      { success: true, data: undefined },
      formData({ id: cat.id, groupId: group.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.category.findUnique({ where: { id: cat.id } })).toBeNull()
  })
})
