import { getLocale, getTranslations } from "next-intl/server"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterForm } from "@/features/auth/components/register-form"
import { getSession } from "@/shared/lib/auth"
import { redirect } from "@/i18n/navigation"

export default async function RegisterPage() {
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
				<CardTitle>{t("createAccount")}</CardTitle>
				<CardDescription>{t("enterDetails")}</CardDescription>
			</CardHeader>
			<CardContent>
				<RegisterForm />
			</CardContent>
		</Card>
	)
}
