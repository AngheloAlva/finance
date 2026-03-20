"use client"

import { useEffect, useMemo } from "react"
import { SplitRule } from "@/generated/prisma/enums"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateEqualSplits } from "@/features/group-finances/lib/split.utils"
import type { SplitMember } from "@/features/group-finances/lib/split.utils"
import { centsToDisplay } from "@/shared/lib/formatters"

interface SplitData {
	userId: string
	amount?: number
	percentage?: number
}

interface SplitInputProps {
	splitRule: SplitRule
	members: SplitMember[]
	totalAmount: number
	onChange: (splits: SplitData[]) => void
}

export function SplitInput({ splitRule, members, totalAmount, onChange }: SplitInputProps) {
	const t = useTranslations("groupFinances.split")
	// EQUAL mode: compute and report splits on mount / when inputs change
	const equalSplits = useMemo(() => {
		if (splitRule !== SplitRule.EQUAL || members.length === 0 || totalAmount <= 0) {
			return []
		}
		return generateEqualSplits(totalAmount, members)
	}, [splitRule, members, totalAmount])

	useEffect(() => {
		if (splitRule === SplitRule.EQUAL && equalSplits.length > 0) {
			onChange(
				equalSplits.map((s) => ({
					userId: s.userId,
					amount: s.amount,
				}))
			)
		}
	}, [splitRule, equalSplits, onChange])

	if (splitRule === SplitRule.EQUAL) {
		return (
			<div className="flex flex-col gap-2">
				<Label className="text-muted-foreground text-xs">
					{t("equalLabel", { count: members.length })}
				</Label>
				{members.map((member) => {
					const split = equalSplits.find((s) => s.userId === member.userId)
					return (
						<div
							key={member.userId}
							className="flex items-center justify-between rounded-none border px-3 py-2 text-sm"
						>
							<span>{member.name || t("unknown")}</span>
							<span className="text-muted-foreground">
								{split ? centsToDisplay(split.amount) : "0.00"}
							</span>
						</div>
					)
				})}
			</div>
		)
	}

	if (splitRule === SplitRule.PROPORTIONAL) {
		return <ProportionalInput members={members} onChange={onChange} />
	}

	if (splitRule === SplitRule.CUSTOM) {
		return <CustomInput members={members} totalAmount={totalAmount} onChange={onChange} />
	}

	return null
}

// ---------------------------------------------------------------------------
// Proportional sub-component
// ---------------------------------------------------------------------------

function ProportionalInput({
	members,
	onChange,
}: {
	members: SplitMember[]
	onChange: (splits: SplitData[]) => void
}) {
	const t = useTranslations("groupFinances.split")
	const initialPercentages = useMemo(
		() => Object.fromEntries(members.map((m) => [m.userId, ""])),
		[members]
	)

	// We use uncontrolled inputs and read via onChange to keep it simple
	function handleChange(userId: string, value: string) {
		initialPercentages[userId] = value

		const splits: SplitData[] = members.map((m) => ({
			userId: m.userId,
			percentage: parseFloat(initialPercentages[m.userId] || "0") || 0,
		}))

		onChange(splits)
	}

	const totalPercentage = members.reduce((sum, m) => {
		const val = parseFloat(initialPercentages[m.userId] || "0") || 0
		return sum + val
	}, 0)

	const isValid = Math.abs(totalPercentage - 100) < 0.01

	return (
		<div className="flex flex-col gap-2">
			<Label className="text-muted-foreground text-xs">
				{t("proportionalLabel")}
			</Label>
			{members.map((member) => (
				<div key={member.userId} className="flex items-center gap-2">
					<span className="min-w-24 text-sm">{member.name || t("unknown")}</span>
					<Input
						type="number"
						min={0}
						max={100}
						step={0.01}
						placeholder="0"
						className="w-24"
						onChange={(e) => handleChange(member.userId, e.target.value)}
					/>
					<span className="text-muted-foreground text-xs">%</span>
				</div>
			))}
			<p className={`text-xs ${isValid ? "text-muted-foreground" : "text-destructive"}`}>
				{t("total", { value: totalPercentage.toFixed(1) })} {!isValid && t("mustBe100")}
			</p>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Custom sub-component
// ---------------------------------------------------------------------------

function CustomInput({
	members,
	totalAmount,
	onChange,
}: {
	members: SplitMember[]
	totalAmount: number
	onChange: (splits: SplitData[]) => void
}) {
	const t = useTranslations("groupFinances.split")
	const amounts = useMemo(() => Object.fromEntries(members.map((m) => [m.userId, ""])), [members])

	function handleChange(userId: string, value: string) {
		amounts[userId] = value

		const splits: SplitData[] = members.map((m) => {
			const cleaned = (amounts[m.userId] || "0").replace(/[^0-9.-]/g, "")
			const parsed = parseFloat(cleaned)
			const cents = Number.isNaN(parsed) ? 0 : Math.round(parsed * 100)
			return { userId: m.userId, amount: cents }
		})

		onChange(splits)
	}

	const totalAllocated = members.reduce((sum, m) => {
		const cleaned = (amounts[m.userId] || "0").replace(/[^0-9.-]/g, "")
		const parsed = parseFloat(cleaned)
		return sum + (Number.isNaN(parsed) ? 0 : Math.round(parsed * 100))
	}, 0)

	const isValid = totalAllocated === totalAmount

	return (
		<div className="flex flex-col gap-2">
			<Label className="text-muted-foreground text-xs">
				{t("customLabel")}
			</Label>
			{members.map((member) => (
				<div key={member.userId} className="flex items-center gap-2">
					<span className="min-w-24 text-sm">{member.name || t("unknown")}</span>
					<Input
						type="text"
						inputMode="decimal"
						placeholder="0.00"
						className="w-24"
						onChange={(e) => handleChange(member.userId, e.target.value)}
					/>
				</div>
			))}
			<p className={`text-xs ${isValid ? "text-muted-foreground" : "text-destructive"}`}>
				{t("allocated", { allocated: centsToDisplay(totalAllocated), total: centsToDisplay(totalAmount) })}{" "}
				{!isValid && t("remaining", { amount: centsToDisplay(Math.abs(totalAmount - totalAllocated)) })}
			</p>
		</div>
	)
}
