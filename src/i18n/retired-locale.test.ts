import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { redirectRetiredLocale } from "@/i18n/retired-locale"

function request(path: string) {
  return new NextRequest(new URL(path, "https://finance.test"))
}

describe("redirectRetiredLocale", () => {
  it("redirects an old English page to the same Spanish page", () => {
    const response = redirectRetiredLocale(request("/en/transactions?month=3"))

    expect(response?.status).toBe(308)
    expect(response?.headers.get("location")).toBe("https://finance.test/es/transactions?month=3")
  })

  it("redirects the old English home page to the Spanish one", () => {
    const response = redirectRetiredLocale(request("/en"))

    expect(response?.status).toBe(308)
    expect(response?.headers.get("location")).toBe("https://finance.test/es")
  })

  it("leaves a path that only starts with the letters en alone", () => {
    expect(redirectRetiredLocale(request("/enroll"))).toBeNull()
  })

  it("leaves Spanish pages alone", () => {
    expect(redirectRetiredLocale(request("/es/transactions"))).toBeNull()
  })
})
