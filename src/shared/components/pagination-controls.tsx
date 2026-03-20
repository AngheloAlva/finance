"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

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
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4">
      {isFirstPage ? (
        <Button variant="outline" size="sm" disabled>
          {t("previous")}
        </Button>
      ) : (
        <Button variant="outline" size="sm" render={<Link href={buildHref(page - 1)} />}>
          {t("previous")}
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        {tNav("page")} {page} / {totalPages}
      </span>

      {isLastPage ? (
        <Button variant="outline" size="sm" disabled>
          {t("next")}
        </Button>
      ) : (
        <Button variant="outline" size="sm" render={<Link href={buildHref(page + 1)} />}>
          {t("next")}
        </Button>
      )}
    </div>
  );
}
