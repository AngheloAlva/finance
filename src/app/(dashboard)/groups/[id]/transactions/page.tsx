import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GroupTransactionDialog } from "@/features/group-finances/components/group-transaction-dialog";
import { GroupTransactionTable } from "@/features/group-finances/components/group-transaction-table";
import { getGroupTransactions } from "@/features/group-finances/lib/group-finances.queries";
import type { GroupTransactionFilters } from "@/features/group-finances/types/group-finances.types";
import { getGroupCategories, getGroupMembers } from "@/features/groups/lib/groups.queries";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import type { SplitMember } from "@/features/group-finances/lib/split.utils";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { PaginationControls } from "@/shared/components/pagination-controls";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";

interface GroupTransactionsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFilters(
  raw: Record<string, string | string[] | undefined>,
): GroupTransactionFilters {
  const page =
    typeof raw.page === "string" ? Math.max(1, parseInt(raw.page, 10)) : 1;
  const pageSize = 20;

  return {
    dateFrom: typeof raw.dateFrom === "string" ? raw.dateFrom : undefined,
    dateTo: typeof raw.dateTo === "string" ? raw.dateTo : undefined,
    categoryId:
      typeof raw.categoryId === "string" ? raw.categoryId : undefined,
    page: Number.isNaN(page) ? 1 : page,
    pageSize,
  };
}

export default async function GroupTransactionsPage({
  params,
  searchParams,
}: GroupTransactionsPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const rawParams = await searchParams;

  const membership = await getGroupMembership(session.user.id, id);

  if (!membership) {
    notFound();
  }

  const filters = parseFilters(rawParams);

  const [result, members, categories, group] = await Promise.all([
    getGroupTransactions(id, filters),
    getGroupMembers(id),
    getGroupCategories(id),
    prisma.group.findUnique({
      where: { id },
      select: { currency: true },
    }),
  ]);

  const currency = (group?.currency ?? "USD") as CurrencyCode;

  const splitMembers: SplitMember[] = members.map((m) => ({
    userId: m.userId,
    name: m.user.name ?? "",
  }));

  const typedCategories = categories as CategoryWithChildren[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Transactions</h2>
        <GroupTransactionDialog
          groupId={id}
          members={splitMembers}
          categories={typedCategories}
          currency={currency}
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              New Transaction
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <GroupTransactionTable
            transactions={result.data}
            currency={currency}
          />
        </CardContent>
      </Card>

      {result.total > 0 && (
        <PaginationControls
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          buildHref={(page) => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.set("dateTo", filters.dateTo);
            if (filters.categoryId)
              params.set("categoryId", filters.categoryId);
            return `/groups/${id}/transactions?${params.toString()}`;
          }}
        />
      )}
    </div>
  );
}
