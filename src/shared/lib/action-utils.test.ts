import { describe, expect, it } from "vitest"
import { formatZodErrors, requireFormId } from "@/shared/lib/action-utils"

describe("formatZodErrors", () => {
  it("maps a single issue to its field", () => {
    const result = formatZodErrors({
      issues: [{ path: ["email"], message: "Invalid email" }],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("VALIDATION_ERROR")
    expect(result.fieldErrors).toEqual({ email: ["Invalid email"] })
  })

  it("accumulates multiple errors on the same field", () => {
    const result = formatZodErrors({
      issues: [
        { path: ["password"], message: "Too short" },
        { path: ["password"], message: "Must contain a number" },
      ],
    })

    expect(result.fieldErrors?.["password"]).toEqual(["Too short", "Must contain a number"])
  })

  it("maps errors across multiple fields independently", () => {
    const result = formatZodErrors({
      issues: [
        { path: ["name"], message: "Required" },
        { path: ["amount"], message: "Must be positive" },
      ],
    })

    expect(result.fieldErrors?.["name"]).toEqual(["Required"])
    expect(result.fieldErrors?.["amount"]).toEqual(["Must be positive"])
  })

  it("ignores issues with an empty path", () => {
    const result = formatZodErrors({
      issues: [{ path: [], message: "Root error" }],
    })

    expect(result.fieldErrors).toEqual({})
  })

  it("returns empty fieldErrors for an empty issues array", () => {
    const result = formatZodErrors({ issues: [] })
    expect(result.fieldErrors).toEqual({})
    expect(result.success).toBe(false)
  })
})

describe("requireFormId", () => {
  function makeForm(entries: Record<string, string>): FormData {
    const fd = new FormData()
    for (const [key, value] of Object.entries(entries)) {
      fd.append(key, value)
    }
    return fd
  }

  it("returns success with the id when the default field is present", () => {
    const result = requireFormId(makeForm({ id: "abc-123" }))
    expect(result).toEqual({ success: true, data: "abc-123" })
  })

  it("reads a custom field name", () => {
    const result = requireFormId(makeForm({ categoryId: "cat-42" }), "categoryId")
    expect(result).toEqual({ success: true, data: "cat-42" })
  })

  it("returns FIELD_REQUIRED when the field is missing", () => {
    const result = requireFormId(makeForm({}))
    expect(result).toEqual({ success: false, error: "FIELD_REQUIRED" })
  })

  it("returns FIELD_REQUIRED when the field is an empty string", () => {
    const result = requireFormId(makeForm({ id: "" }))
    expect(result).toEqual({ success: false, error: "FIELD_REQUIRED" })
  })
})
