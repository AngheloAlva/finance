"use client";

import { PaginationControls } from "@/shared/components/pagination-controls";

interface AlertPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  status?: string;
}

export function AlertPagination({
  total,
  page,
  pageSize,
  status,
}: AlertPaginationProps) {
  function buildHref(targetPage: number): string {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    p.set("page", String(targetPage));
    return `/alerts?${p.toString()}`;
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
