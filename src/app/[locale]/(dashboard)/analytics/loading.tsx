import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function ChartSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-48" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-[300px] w-full rounded-none" />
			</CardContent>
		</Card>
	)
}

export default function AnalyticsLoading() {
	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-7 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
				</div>
			</div>

			{/* Income vs Expenses Trend */}
			<ChartSkeleton />

			{/* Cash Flow Forecast */}
			<ChartSkeleton />

			{/* Two column grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<ChartSkeleton />
				<ChartSkeleton />
			</div>

			{/* Spending Heatmap */}
			<ChartSkeleton />

			{/* Net Worth */}
			<ChartSkeleton />

			{/* Health Score */}
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-36" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mx-auto h-[200px] w-[200px] rounded-none" />
				</CardContent>
			</Card>
		</div>
	)
}
