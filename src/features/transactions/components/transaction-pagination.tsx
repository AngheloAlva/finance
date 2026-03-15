"use client";

import { PaginationControls } from "@/shared/components/pagination-controls";

interface TransactionPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  searchParams: Record<string, string | string[] | undefined>;
}

export function TransactionPagination({
  total,
  page,
  pageSize,
  searchParams,
}: TransactionPaginationProps) {
  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    }

    params.set("page", String(targetPage));

    return `/transactions?${params.toString()}`;
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
