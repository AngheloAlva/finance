import { describe, expect, it } from "vitest"
import {
  getGroupById,
  getGroupCategories,
  getGroupInvitations,
  getGroupMembers,
  getInvitationByToken,
  getUserGroups,
} from "@/features/groups/lib/groups.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createGroup,
  createGroupInvitation,
  createGroupMember,
  createUser,
} from "../../../../tests/helpers/factories"

describe("getUserGroups", () => {
  it("returns empty when user belongs to no groups", async () => {
    const user = await createUser()
    const result = await getUserGroups(user.id)
    expect(result).toEqual([])
  })

  it("returns each group the user belongs to with member count and current role", async () => {
    const user = await createUser()
    const other = await createUser()
    const a = await createGroup({ name: "A" })
    const b = await createGroup({ name: "B" })
    await createGroupMember(user.id, a.id, "OWNER")
    await createGroupMember(other.id, a.id, "MEMBER")
    await createGroupMember(user.id, b.id, "ADMIN")

    const result = await getUserGroups(user.id)
    expect(result).toHaveLength(2)
    const byName = Object.fromEntries(result.map((g) => [g.name, g]))
    expect(byName.A.memberCount).toBe(2)
    expect(byName.A.currentUserRole).toBe("OWNER")
    expect(byName.B.memberCount).toBe(1)
    expect(byName.B.currentUserRole).toBe("ADMIN")
  })
})

describe("getGroupById", () => {
  it("returns null when group does not exist", async () => {
    const result = await getGroupById("missing")
    expect(result).toBeNull()
  })

  it("returns the group with members ordered by joinedAt asc and pending invitations", async () => {
    const owner = await createUser({ name: "Owner" })
    const member = await createUser({ name: "Member" })
    const inviter = owner
    const group = await createGroup({ name: "Trip" })
    await createGroupMember(owner.id, group.id, "OWNER")
    await createGroupMember(member.id, group.id, "MEMBER")
    await createGroupInvitation(group.id, inviter.id, { status: "PENDING" })
    await createGroupInvitation(group.id, inviter.id, { status: "ACCEPTED" })

    const result = await getGroupById(group.id)
    expect(result).not.toBeNull()
    expect(result!.memberCount).toBe(2)
    expect(result!.members).toHaveLength(2)
    expect(result!.invitations).toHaveLength(1)
    expect(result!.invitations[0].status).toBe("PENDING")
  })
})

describe("getGroupMembers", () => {
  it("returns members with user info ordered by joinedAt asc", async () => {
    const a = await createUser({ name: "Alice" })
    const b = await createUser({ name: "Bob" })
    const group = await createGroup()
    await createGroupMember(a.id, group.id, "OWNER")
    await createGroupMember(b.id, group.id, "MEMBER")

    const result = await getGroupMembers(group.id)
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.user.name)).toEqual(["Alice", "Bob"])
  })
})

describe("getGroupInvitations", () => {
  it("returns only PENDING invitations with inviter info", async () => {
    const inviter = await createUser({ name: "Inviter" })
    const group = await createGroup()
    await createGroupMember(inviter.id, group.id, "OWNER")
    await createGroupInvitation(group.id, inviter.id, {
      email: "p@test.local",
      status: "PENDING",
    })
    await createGroupInvitation(group.id, inviter.id, {
      email: "a@test.local",
      status: "ACCEPTED",
    })
    await createGroupInvitation(group.id, inviter.id, {
      email: "e@test.local",
      status: "EXPIRED",
    })

    const result = await getGroupInvitations(group.id)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe("p@test.local")
    expect(result[0].invitedBy.name).toBe("Inviter")
  })
})

describe("getGroupCategories", () => {
  it("returns only GROUP-scoped categories for the given group with their children", async () => {
    const group = await createGroup()
    const otherGroup = await createGroup()

    const parent = await prisma.category.create({
      data: {
        name: "Food",
        icon: "fork",
        color: "#ff0000",
        scope: "GROUP",
        group: { connect: { id: group.id } },
      },
    })
    await prisma.category.create({
      data: {
        name: "Delivery",
        icon: "bike",
        color: "#aa0000",
        scope: "GROUP",
        group: { connect: { id: group.id } },
        parent: { connect: { id: parent.id } },
      },
    })
    await prisma.category.create({
      data: {
        name: "Other Group Cat",
        icon: "circle",
        color: "#000",
        scope: "GROUP",
        group: { connect: { id: otherGroup.id } },
      },
    })

    const result = await getGroupCategories(group.id)
    const names = result.map((c) => c.name).sort()
    expect(names).toEqual(["Delivery", "Food"])
    const food = result.find((c) => c.name === "Food")
    expect(food!.children.map((c) => c.name)).toEqual(["Delivery"])
  })
})

describe("getInvitationByToken", () => {
  it("returns null for an unknown token", async () => {
    const result = await getInvitationByToken("does-not-exist")
    expect(result).toBeNull()
  })

  it("returns the invitation with group info when token exists", async () => {
    const inviter = await createUser()
    const group = await createGroup({ name: "Roomies", description: "house" })
    await createGroupMember(inviter.id, group.id, "OWNER")
    const inv = await createGroupInvitation(group.id, inviter.id, {
      token: "secret-token",
    })

    const result = await getInvitationByToken("secret-token")
    expect(result).not.toBeNull()
    expect(result!.id).toBe(inv.id)
    expect(result!.group.name).toBe("Roomies")
  })
})
