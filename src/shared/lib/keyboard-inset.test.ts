import { describe, expect, it } from "vitest"

import { getKeyboardInset } from "@/shared/lib/keyboard-inset"

describe("getKeyboardInset", () => {
	it("returns 0 when the visual viewport fills the layout viewport", () => {
		expect(getKeyboardInset(874, { height: 874, offsetTop: 0 })).toBe(0)
	})

	it("returns the covered height when the keyboard shrinks the visual viewport", () => {
		expect(getKeyboardInset(874, { height: 504, offsetTop: 0 })).toBe(370)
	})

	it("subtracts the visual viewport scroll offset that iOS applies on focus", () => {
		expect(getKeyboardInset(874, { height: 504, offsetTop: 120 })).toBe(250)
	})

	it("never returns a negative inset", () => {
		expect(getKeyboardInset(874, { height: 900, offsetTop: 0 })).toBe(0)
	})

	it("ignores sub-pixel noise and rounds to whole pixels", () => {
		expect(getKeyboardInset(874, { height: 873.6, offsetTop: 0 })).toBe(0)
		expect(getKeyboardInset(874, { height: 503.4, offsetTop: 0 })).toBe(371)
	})
})
