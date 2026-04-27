import { describe, expect, it } from "vitest"
import {
  getUserTagOptions,
  getUserTags,
} from "@/features/tags/lib/tags.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createTag,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

describe("getUserTags", () => {
  it("returns all tags for user with transaction counts", async () => {
    const user = await createUser()
    const tagA = await createTag(user.id, { name: "groceries" })
    const tagB = await createTag(user.id, { name: "fun" })

    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
    })
    await prisma.transactionTag.create({
      data: {
        transaction: { connect: { id: tx.id } },
        tag: { connect: { id: tagA.id } },
      },
    })

    const tags = await getUserTags(user.id)

    expect(tags).toHaveLength(2)
    const groceries = tags.find((t) => t.id === tagA.id)
    const fun = tags.find((t) => t.id === tagB.id)
    expect(groceries?._count.transactions).toBe(1)
    expect(fun?._count.transactions).toBe(0)
  })

  it("returns tags sorted alphabetically by name", async () => {
    const user = await createUser()
    await createTag(user.id, { name: "zebra" })
    await createTag(user.id, { name: "apple" })
    await createTag(user.id, { name: "mango" })

    const tags = await getUserTags(user.id)

    expect(tags.map((t) => t.name)).toEqual(["apple", "mango", "zebra"])
  })

  it("does not leak tags from other users", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createTag(userA.id, { name: "a-tag" })
    await createTag(userB.id, { name: "b-tag" })

    const tags = await getUserTags(userA.id)

    expect(tags.map((t) => t.name)).toEqual(["a-tag"])
  })
})

describe("getUserTagOptions", () => {
  it("returns minimal id/name/color shape sorted by name", async () => {
    const user = await createUser()
    await createTag(user.id, { name: "beta", color: "#fff" })
    await createTag(user.id, { name: "alpha", color: "#000" })

    const options = await getUserTagOptions(user.id)

    expect(options.map((o) => o.name)).toEqual(["alpha", "beta"])
    expect(options[0]).toEqual(
      expect.objectContaining({ name: "alpha", color: "#000" }),
    )
  })
})
