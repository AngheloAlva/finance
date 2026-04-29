import { describe, expect, it } from "vitest"
import {
  canChangeRoles,
  canContributeToGoals,
  canDeleteGroup,
  canManageCategories,
  canManageGoals,
  canManageMembers,
  canRemoveMember,
} from "@/features/groups/lib/groups.permissions.shared"

describe("canManageMembers", () => {
  it("OWNER and ADMIN can, MEMBER cannot", () => {
    expect(canManageMembers("OWNER")).toBe(true)
    expect(canManageMembers("ADMIN")).toBe(true)
    expect(canManageMembers("MEMBER")).toBe(false)
  })
})

describe("canManageCategories", () => {
  it("OWNER and ADMIN can, MEMBER cannot", () => {
    expect(canManageCategories("OWNER")).toBe(true)
    expect(canManageCategories("ADMIN")).toBe(true)
    expect(canManageCategories("MEMBER")).toBe(false)
  })
})

describe("canDeleteGroup", () => {
  it("only OWNER can", () => {
    expect(canDeleteGroup("OWNER")).toBe(true)
    expect(canDeleteGroup("ADMIN")).toBe(false)
    expect(canDeleteGroup("MEMBER")).toBe(false)
  })
})

describe("canChangeRoles", () => {
  it("only OWNER can", () => {
    expect(canChangeRoles("OWNER")).toBe(true)
    expect(canChangeRoles("ADMIN")).toBe(false)
    expect(canChangeRoles("MEMBER")).toBe(false)
  })
})

describe("canRemoveMember", () => {
  it("OWNER can remove ADMIN and MEMBER but not OWNER", () => {
    expect(canRemoveMember("OWNER", "OWNER")).toBe(false)
    expect(canRemoveMember("OWNER", "ADMIN")).toBe(true)
    expect(canRemoveMember("OWNER", "MEMBER")).toBe(true)
  })

  it("ADMIN can only remove MEMBER", () => {
    expect(canRemoveMember("ADMIN", "OWNER")).toBe(false)
    expect(canRemoveMember("ADMIN", "ADMIN")).toBe(false)
    expect(canRemoveMember("ADMIN", "MEMBER")).toBe(true)
  })

  it("MEMBER can never remove anyone", () => {
    expect(canRemoveMember("MEMBER", "OWNER")).toBe(false)
    expect(canRemoveMember("MEMBER", "ADMIN")).toBe(false)
    expect(canRemoveMember("MEMBER", "MEMBER")).toBe(false)
  })
})

describe("canManageGoals", () => {
  it("OWNER and ADMIN can, MEMBER cannot", () => {
    expect(canManageGoals("OWNER")).toBe(true)
    expect(canManageGoals("ADMIN")).toBe(true)
    expect(canManageGoals("MEMBER")).toBe(false)
  })
})

describe("canContributeToGoals", () => {
  it("any role can contribute", () => {
    expect(canContributeToGoals("OWNER")).toBe(true)
    expect(canContributeToGoals("ADMIN")).toBe(true)
    expect(canContributeToGoals("MEMBER")).toBe(true)
  })
})
