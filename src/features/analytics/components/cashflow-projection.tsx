"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrencyCode } from "@/shared/lib/constants";

import type { ProjectionResult } from "@/features/analytics/types/analytics.types";
import { CashflowProjectionChart } from "@/features/analytics/components/cashflow-projection-chart";
import { ProjectionSummaryCards } from "@/features/analytics/components/projection-summary-cards";

interface CashflowProjectionProps {
  data: ProjectionResult;
  currency: CurrencyCode;
}

export function CashflowProjection({ data, currency }: CashflowProjectionProps) {
  const t = useTranslations("projection");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ProjectionSummaryCards summary={data.summary} currency={currency} />
        <CashflowProjectionChart data={data.points} currency={currency} />
      </CardContent>
    </Card>
  );
}
