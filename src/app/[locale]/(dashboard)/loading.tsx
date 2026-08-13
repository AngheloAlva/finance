import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-7 w-28" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
					<Skeleton className="h-[72px] w-full rounded-none" />
					<Skeleton className="h-[72px] w-full rounded-none" />
					<Skeleton className="h-[72px] w-full rounded-none" />
					<Skeleton className="h-[72px] w-full rounded-none" />
				</div>

				<Skeleton className="h-[72px] w-full rounded-none lg:col-span-2" />
				<Skeleton className="h-[220px] w-full rounded-none lg:col-span-2" />
				<Skeleton className="h-[300px] w-full rounded-none" />
				<Skeleton className="h-[300px] w-full rounded-none" />
				<Skeleton className="h-[160px] w-full rounded-none lg:col-span-2" />
				<Skeleton className="h-[160px] w-full rounded-none lg:col-span-2" />
			</div>
		</div>
	)
}
