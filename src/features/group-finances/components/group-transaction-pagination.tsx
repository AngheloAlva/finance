"use client";

import { PaginationControls } from "@/shared/components/pagination-controls";
import type { GroupTransactionFilters } from "@/features/group-finances/types/group-finances.types";

interface GroupTransactionPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  groupId: string;
  filters: GroupTransactionFilters;
}

export function GroupTransactionPagination({
  total,
  page,
  pageSize,
  groupId,
  filters,
}: GroupTransactionPaginationProps) {
  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();
    params.set("page", targetPage.toString());
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    return `/groups/${groupId}/transactions?${params.toString()}`;
  }

  return (
    <PaginationControls
      total={total}
      page={page}
      pageSize={pageSize}
      buildHref={buildHref}
    />
  );
}
