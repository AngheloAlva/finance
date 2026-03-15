"use client"

import type { GroupCategoryBreakdownItem } from "@/features/group-finances/types/group-finances.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { CategoryPieChart } from "@/shared/components/category-pie-chart"

interface GroupCategoryChartProps {
	data: GroupCategoryBreakdownItem[]
	currency: CurrencyCode
}

export function GroupCategoryChart({ data, currency }: GroupCategoryChartProps) {
	return (
		<CategoryPieChart
			data={data as unknown as Record<string, unknown>[]}
			currency={currency}
			nameKey="name"
			colorKey="color"
		/>
	)
}
