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
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}))
vi.mock("@/features/auth/lib/auth.config", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { auth } from "@/features/auth/lib/auth.config"
import { loginAction } from "@/features/auth/actions/login.action"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { registerAction } from "@/features/auth/actions/register.action"
import { prisma } from "@/shared/lib/prisma"
import { expectRedirect, formData } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("registerAction", () => {
  it("calls signUpEmail with the validated payload and redirects", async () => {
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never)

    await expectRedirect(
      registerAction(
        { success: true, data: undefined },
        formData({
          name: "Jane Doe",
          email: "jane@test.local",
          password: "supersecret",
          confirmPassword: "supersecret",
        }),
      ),
      "/",
    )

    expect(auth.api.signUpEmail).toHaveBeenCalledOnce()
    expect(auth.api.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { name: "Jane Doe", email: "jane@test.local", password: "supersecret" },
      }),
    )
    expect(auth.api.signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "jane@test.local", password: "supersecret" },
      }),
    )
  })

  it("saves preferences before signing in, matching the stored lowercase email", async () => {
    await prisma.user.create({ data: { name: "Ana", email: "ana@test.local" } })
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never)
    let timezoneAtSignIn: string | undefined
    vi.mocked(auth.api.signInEmail).mockImplementationOnce((async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.local" } })
      timezoneAtSignIn = user.timezone
      return {}
    }) as never)

    await expectRedirect(
      registerAction(
        { success: true, data: undefined },
        formData({
          name: "Ana",
          email: "Ana@Test.local",
          password: "supersecret",
          confirmPassword: "supersecret",
          timezone: "America/Santiago",
        }),
      ),
      "/",
    )

    expect(timezoneAtSignIn).toBe("America/Santiago")
  })

  it("sends the user to login when the automatic sign-in fails", async () => {
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never)
    vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error("nope"))

    await expectRedirect(
      registerAction(
        { success: true, data: undefined },
        formData({
          name: "Jane",
          email: "jane@test.local",
          password: "supersecret",
          confirmPassword: "supersecret",
        }),
      ),
      "/login",
    )
  })

  it("returns VALIDATION_ERROR when passwords do not match", async () => {
    const result = await registerAction(
      { success: true, data: undefined },
      formData({
        name: "Jane",
        email: "jane@test.local",
        password: "supersecret",
        confirmPassword: "different1",
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("stores the device time zone and its currency on the new account", async () => {
    await prisma.user.create({ data: { name: "Ana", email: "ana@test.local" } })
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never)

    await expectRedirect(
      registerAction(
        { success: true, data: undefined },
        formData({
          name: "Ana",
          email: "ana@test.local",
          password: "supersecret",
          confirmPassword: "supersecret",
          timezone: "America/Santiago",
        }),
      ),
      "/",
    )

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.local" } })
    expect(user.timezone).toBe("America/Santiago")
    expect(user.currency).toBe("CLP")
  })

  it("keeps the USD and UTC defaults when the device time zone is unsupported", async () => {
    await prisma.user.create({ data: { name: "Ana", email: "ana@test.local" } })
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never)

    await expectRedirect(
      registerAction(
        { success: true, data: undefined },
        formData({
          name: "Ana",
          email: "ana@test.local",
          password: "supersecret",
          confirmPassword: "supersecret",
          timezone: "Mars/Olympus_Mons",
        }),
      ),
      "/",
    )

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.local" } })
    expect(user.timezone).toBe("UTC")
    expect(user.currency).toBe("USD")
  })

  it("returns AUTH_REGISTER_FAILED when signUpEmail throws", async () => {
    vi.mocked(auth.api.signUpEmail).mockRejectedValue(new Error("nope"))

    const result = await registerAction(
      { success: true, data: undefined },
      formData({
        name: "Jane",
        email: "dup@test.local",
        password: "supersecret",
        confirmPassword: "supersecret",
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("AUTH_REGISTER_FAILED")
  })
})

describe("loginAction", () => {
  it("calls signInEmail and redirects on success", async () => {
    vi.mocked(auth.api.signInEmail).mockResolvedValue({} as never)

    await expectRedirect(
      loginAction(
        { success: true, data: undefined },
        formData({ email: "jane@test.local", password: "supersecret" }),
      ),
      "/",
    )

    expect(auth.api.signInEmail).toHaveBeenCalledOnce()
  })

  it("returns AUTH_INVALID_CREDENTIALS when signInEmail throws", async () => {
    vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error("bad creds"))

    const result = await loginAction(
      { success: true, data: undefined },
      formData({ email: "jane@test.local", password: "wrongpassword" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("AUTH_INVALID_CREDENTIALS")
  })

  it("returns VALIDATION_ERROR for an invalid email", async () => {
    const result = await loginAction(
      { success: true, data: undefined },
      formData({ email: "not-an-email", password: "supersecret" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })
})

describe("logoutAction", () => {
  it("calls signOut and redirects to /login", async () => {
    vi.mocked(auth.api.signOut).mockResolvedValue({} as never)

    await expectRedirect(logoutAction(), "/login")

    expect(auth.api.signOut).toHaveBeenCalledOnce()
  })
})
