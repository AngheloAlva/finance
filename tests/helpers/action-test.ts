import { expect, vi } from "vitest"

import { requireSession, getSession } from "@/shared/lib/auth"

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>

export function buildSession(userId: string, overrides: Partial<Session["user"]> = {}): Session {
  return {
    user: {
      id: userId,
      email: `${userId}@test.local`,
      name: "Test",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      ...overrides,
    },
    session: {
      id: `sess-${userId}`,
      userId,
      token: "test-token",
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as unknown as Session
}

export function setSessionUser(userId: string, overrides: Partial<Session["user"]> = {}): Session {
  const session = buildSession(userId, overrides)
  vi.mocked(requireSession).mockResolvedValue(session)
  vi.mocked(getSession).mockResolvedValue(session)
  return session
}

export function clearSession() {
  vi.mocked(getSession).mockResolvedValue(null as never)
  vi.mocked(requireSession).mockReset()
}

export function formData(values: Record<string, string | number | string[] | null | undefined>): FormData {
  const fd = new FormData()
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue
    if (Array.isArray(val)) {
      for (const v of val) fd.append(key, v)
    } else {
      fd.append(key, String(val))
    }
  }
  return fd
}

/**
 * Asserts that the awaited promise threw a Next.js redirect error.
 * Server actions that succeed via `redirect()` throw an error with `digest` starting with NEXT_REDIRECT.
 */
export async function expectRedirect(promise: Promise<unknown>, urlContains?: string) {
  let caught: unknown
  try {
    await promise
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(Error)
  const err = caught as Error & { digest?: string }
  expect(err.message).toBe("NEXT_REDIRECT")
  if (urlContains) {
    expect(err.digest ?? "").toContain(urlContains)
  }
}
