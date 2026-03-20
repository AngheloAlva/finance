"use client"

import { useTranslations } from "next-intl"

interface FieldErrorProps {
	errors: string[] | string | undefined
}

export function FieldError({ errors }: FieldErrorProps) {
	const tv = useTranslations("validation")

	if (!errors || (Array.isArray(errors) && errors.length === 0)) return null

	const code = Array.isArray(errors) ? errors[0] : errors
	const message = tv.has(code) ? tv(code) : code

	return <p className="text-destructive text-xs">{message}</p>
}
