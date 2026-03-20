import { getLocale, getTranslations } from "next-intl/server"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/features/auth/components/login-form"
import { getSession } from "@/shared/lib/auth"
import { redirect } from "@/i18n/navigation"

export default async function LoginPage() {
	const session = await getSession()
	const locale = await getLocale()

	if (session) {
		redirect({
			href: "/",
			locale,
		})
	}

	const t = await getTranslations("auth")

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>{t("welcomeBack")}</CardTitle>
				<CardDescription>{t("enterCredentials")}</CardDescription>
			</CardHeader>
			<CardContent>
				<LoginForm />
			</CardContent>
		</Card>
	)
}
