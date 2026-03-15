"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  total: number;
  page: number;
  pageSize: number;
  buildHref: (page: number) => string;
}

export function PaginationControls({
  total,
  page,
  pageSize,
  buildHref,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4">
      {isFirstPage ? (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      ) : (
        <Button variant="outline" size="sm" render={<Link href={buildHref(page - 1)} />}>
          Previous
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {isLastPage ? (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      ) : (
        <Button variant="outline" size="sm" render={<Link href={buildHref(page + 1)} />}>
          Next
        </Button>
      )}
    </div>
  );
}
