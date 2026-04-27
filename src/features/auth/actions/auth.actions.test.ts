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
