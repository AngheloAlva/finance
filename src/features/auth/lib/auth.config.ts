import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { prisma } from "@/shared/lib/prisma"

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},
	user: {
		additionalFields: {
			currency: {
				type: "string",
				defaultValue: "USD",
				input: false,
			},
			timezone: {
				type: "string",
				defaultValue: "UTC",
				input: false,
			},
		},
	},
	plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
