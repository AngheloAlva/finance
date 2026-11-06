import { TIMEZONES, type CurrencyCode, type TimezoneValue } from "@/shared/lib/constants"

/** Local currency for each supported time zone. Zones not listed use USD. */
const CURRENCY_BY_TIMEZONE: Partial<Record<TimezoneValue, CurrencyCode>> = {
	"America/Argentina/Buenos_Aires": "ARS",
	"America/Sao_Paulo": "BRL",
	"America/Santiago": "CLP",
	"America/Bogota": "COP",
	"America/Mexico_City": "MXN",
	"America/Lima": "PEN",
	"America/Montevideo": "UYU",
	"America/Toronto": "CAD",
	"America/Vancouver": "CAD",
	"Europe/London": "GBP",
	"Europe/Paris": "EUR",
	"Europe/Berlin": "EUR",
	"Europe/Madrid": "EUR",
	"Europe/Rome": "EUR",
	"Europe/Amsterdam": "EUR",
	"Europe/Zurich": "CHF",
	"Asia/Tokyo": "JPY",
	"Asia/Shanghai": "CNY",
	"Australia/Sydney": "AUD",
	"Australia/Melbourne": "AUD",
}

const SUPPORTED_TIMEZONES = new Set<string>(TIMEZONES.map((tz) => tz.value))

export interface DevicePreferences {
	timezone: TimezoneValue
	currency: CurrencyCode
}

/**
 * Turns the time zone reported by the browser into account preferences.
 * Returns null when the zone is not one the app supports, so the account
 * keeps its defaults.
 */
export function resolveDevicePreferences(timezone: unknown): DevicePreferences | null {
	if (typeof timezone !== "string" || !SUPPORTED_TIMEZONES.has(timezone)) return null
	const zone = timezone as TimezoneValue
	return { timezone: zone, currency: CURRENCY_BY_TIMEZONE[zone] ?? "USD" }
}
