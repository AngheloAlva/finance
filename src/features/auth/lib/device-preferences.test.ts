import { describe, expect, it } from "vitest"

import { resolveDevicePreferences } from "@/features/auth/lib/device-preferences"

describe("resolveDevicePreferences", () => {
	it("maps a supported time zone to its local currency", () => {
		expect(resolveDevicePreferences("America/Santiago")).toEqual({
			timezone: "America/Santiago",
			currency: "CLP",
		})
		expect(resolveDevicePreferences("Europe/Madrid")).toEqual({
			timezone: "Europe/Madrid",
			currency: "EUR",
		})
	})

	it("keeps the time zone and falls back to USD when the zone has no mapped currency", () => {
		expect(resolveDevicePreferences("Asia/Dubai")).toEqual({
			timezone: "Asia/Dubai",
			currency: "USD",
		})
	})

	it("returns null for unsupported or missing time zones", () => {
		expect(resolveDevicePreferences("Mars/Olympus_Mons")).toBeNull()
		expect(resolveDevicePreferences(undefined)).toBeNull()
		expect(resolveDevicePreferences(42)).toBeNull()
	})
})
