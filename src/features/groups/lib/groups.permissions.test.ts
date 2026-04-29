import { describe, expect, it } from "vitest"
import {
  assertGroupRole,
  getGroupMembership,
} from "@/features/groups/lib/groups.permissions"
import {
  createGroup,
  createGroupMember,
  createUser,
} from "../../../../tests/helpers/factories"

describe("getGroupMembership", () => {
  it("returns the membership when the user belongs to the group", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "ADMIN")

    const membership = await getGroupMembership(user.id, group.id)
    expect(membership).not.toBeNull()
    expect(membership!.role).toBe("ADMIN")
  })

  it("returns null when the user is not a member", async () => {
    const user = await createUser()
    const group = await createGroup()
    const result = await getGroupMembership(user.id, group.id)
    expect(result).toBeNull()
  })
})

describe("assertGroupRole", () => {
  it("returns success with the membership when the role matches", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "OWNER")

    const result = await assertGroupRole(user.id, group.id, "OWNER", "ADMIN")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe("OWNER")
    }
  })

  it("returns GROUP_NOT_MEMBER when user is not a member", async () => {
    const user = await createUser()
    const group = await createGroup()
    const result = await assertGroupRole(user.id, group.id, "OWNER")
    expect(result).toEqual({ success: false, error: "GROUP_NOT_MEMBER" })
  })

  it("returns GROUP_PERMISSION_DENIED when role does not match", async () => {
    const user = await createUser()
    const group = await createGroup()
    await createGroupMember(user.id, group.id, "MEMBER")
    const result = await assertGroupRole(user.id, group.id, "OWNER", "ADMIN")
    expect(result).toEqual({ success: false, error: "GROUP_PERMISSION_DENIED" })
  })
})
