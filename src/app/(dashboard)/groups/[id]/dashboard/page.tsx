import { notFound } from "next/navigation";

import { GroupBalanceSummary } from "@/features/group-finances/components/group-balance-summary";
import { GroupCategoryChart } from "@/features/group-finances/components/group-category-chart";
import { GroupMonthSelector } from "@/features/group-finances/components/group-month-selector";
import { GroupMonthlyFlowChart } from "@/features/group-finances/components/group-monthly-flow-chart";
import { GroupOverviewCards } from "@/features/group-finances/components/group-overview-cards";
import {
  getGroupCategoryBreakdown,
  getGroupMonthlyFlow,
  getGroupOverview,
  getMemberBalances,
} from "@/features/group-finances/lib/group-finances.queries";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";
import { prisma } from "@/shared/lib/prisma";

interface GroupDashboardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseMonthYear(params: Record<string, string | string[] | undefined>) {
  const now = new Date();

  const rawMonth =
    typeof params.month === "string" ? parseInt(params.month, 10) : NaN;
  const rawYear =
    typeof params.year === "string" ? parseInt(params.year, 10) : NaN;

  const month =
    !Number.isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : now.getMonth() + 1;

  const year =
    !Number.isNaN(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? rawYear
      : now.getFullYear();

  return { month, year };
}

export default async function GroupDashboardPage({
  params,
  searchParams,
}: GroupDashboardPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const rawParams = await searchParams;
  const { month, year } = parseMonthYear(rawParams);

  const membership = await getGroupMembership(session.user.id, id);

  if (!membership) {
    notFound();
  }

  const [overview, categoryBreakdown, monthlyFlow, balances, group] =
    await Promise.all([
      getGroupOverview(id, month, year),
      getGroupCategoryBreakdown(id, month, year),
      getGroupMonthlyFlow(id, month, year),
      getMemberBalances(id),
      prisma.group.findUnique({
        where: { id },
        select: { currency: true },
      }),
    ]);

  const currency = (group?.currency ?? "USD") as CurrencyCode;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dashboard</h2>
        <GroupMonthSelector groupId={id} month={month} year={year} />
      </div>

      <GroupOverviewCards overview={overview} currency={currency} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GroupCategoryChart data={categoryBreakdown} currency={currency} />
        <GroupMonthlyFlowChart data={monthlyFlow} currency={currency} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Member Balances</h3>
        <GroupBalanceSummary balances={balances} currency={currency} />
      </div>
    </div>
  );
}
