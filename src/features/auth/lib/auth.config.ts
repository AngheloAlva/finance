import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { APP_CURRENCY, APP_TIMEZONE } from "@/shared/lib/constants"
import { prisma } from "@/shared/lib/prisma"

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		// registerAction signs in on its own so a failed sign-in can send the
		// new user to the login page.
		autoSignIn: false,
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
				defaultValue: APP_CURRENCY,
				input: false,
			},
			timezone: {
				type: "string",
				defaultValue: APP_TIMEZONE,
				input: false,
			},
		},
	},
	plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
