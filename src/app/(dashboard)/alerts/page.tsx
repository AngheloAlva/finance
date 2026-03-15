import { AlertStatus } from "@/generated/prisma/enums"

import { getUserAlerts, getUnreadAlertCount } from "@/features/alerts/lib/alerts.queries"
import { AlertFilters } from "@/features/alerts/components/alert-filters"
import { AlertList } from "@/features/alerts/components/alert-list"
import { MarkAllReadButton } from "@/features/alerts/components/mark-all-read-button"
import { PaginationControls } from "@/shared/components/pagination-controls"
import { requireSession } from "@/shared/lib/auth"

interface AlertsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
	const session = await requireSession()
	const params = await searchParams

	const rawStatus = typeof params.status === "string" ? params.status : undefined
	const status = rawStatus && rawStatus in AlertStatus ? (rawStatus as AlertStatus) : undefined
	const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1
	const pageSize = 20

	const [alertsResult, pendingCount] = await Promise.all([
		getUserAlerts(session.user.id, { status, page, pageSize }),
		getUnreadAlertCount(session.user.id),
	])

	function buildHref(targetPage: number): string {
		const p = new URLSearchParams()
		if (status) p.set("status", status)
		p.set("page", String(targetPage))
		return `/alerts?${p.toString()}`
	}

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Alerts</h1>
				{pendingCount > 0 && <MarkAllReadButton />}
			</div>

			<AlertFilters />

			<AlertList alerts={alertsResult.data} />

			{alertsResult.totalPages > 1 && (
				<PaginationControls
					total={alertsResult.total}
					page={alertsResult.page}
					pageSize={alertsResult.pageSize}
					buildHref={buildHref}
				/>
			)}
		</div>
	)
}
