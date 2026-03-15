"use client"

import type { CategoryBreakdownItem } from "@/features/dashboard/types/dashboard.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { CategoryPieChart } from "@/shared/components/category-pie-chart"

interface CategoryChartProps {
	data: CategoryBreakdownItem[]
	currency: CurrencyCode
}

export function CategoryChart({ data, currency }: CategoryChartProps) {
	return (
		<CategoryPieChart
			data={data as unknown as Record<string, unknown>[]}
			currency={currency}
			nameKey="categoryName"
			colorKey="categoryColor"
		/>
	)
}
