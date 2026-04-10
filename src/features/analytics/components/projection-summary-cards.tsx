"use client";

import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency } from "@/shared/lib/formatters";

import type { ProjectionSummary } from "@/features/analytics/types/analytics.types";

interface ProjectionSummaryCardsProps {
  summary: ProjectionSummary;
  currency: CurrencyCode;
}

function formatDateLabel(dateKey: string, locale: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface HorizonCardProps {
  label: string;
  balance: number;
  startingBalance: number;
  currency: CurrencyCode;
  locale: string;
}

function HorizonCard({
  label,
  balance,
  startingBalance,
  currency,
  locale,
}: HorizonCardProps) {
  const delta = balance - startingBalance;
  const isNegative = balance < 0;
  const isGain = delta >= 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs uppercase tracking-wide">
          <Wallet className="h-3.5 w-3.5" />
          {label}
        </div>
        <div
          className={`text-lg font-semibold ${
            isNegative ? "text-red-500" : "text-foreground"
          }`}
        >
          {formatCurrency(balance, currency, locale)}
        </div>
        <div
          className={`flex items-center gap-1 text-xs ${
            isGain ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isGain ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isGain ? "+" : ""}
          {formatCurrency(delta, currency, locale)}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectionSummaryCards({
  summary,
  currency,
}: ProjectionSummaryCardsProps) {
  const t = useTranslations("projection");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs uppercase tracking-wide">
              <Wallet className="h-3.5 w-3.5" />
              {t("startingBalance")}
            </div>
            <div
              className={`text-lg font-semibold ${
                summary.startingBalance < 0 ? "text-red-500" : "text-foreground"
              }`}
            >
              {formatCurrency(summary.startingBalance, currency, locale)}
            </div>
            <div className="text-muted-foreground text-xs">{t("today")}</div>
          </CardContent>
        </Card>

        <HorizonCard
          label={t("days30")}
          balance={summary.balance30}
          startingBalance={summary.startingBalance}
          currency={currency}
          locale={locale}
        />
        <HorizonCard
          label={t("days60")}
          balance={summary.balance60}
          startingBalance={summary.startingBalance}
          currency={currency}
          locale={locale}
        />
        <HorizonCard
          label={t("days90")}
          balance={summary.balance90}
          startingBalance={summary.startingBalance}
          currency={currency}
          locale={locale}
        />
      </div>

      {summary.willGoNegative && summary.lowestPoint ? (
        <div className="flex items-start gap-3 rounded-none border border-red-500/40 bg-red-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div className="flex flex-col gap-0.5 text-sm">
            <p className="font-medium text-red-500">{t("negativeWarning")}</p>
            <p className="text-muted-foreground text-xs">
              {t("lowestPointMessage", {
                amount: formatCurrency(
                  summary.lowestPoint.balance,
                  currency,
                  locale,
                ),
                date: formatDateLabel(summary.lowestPoint.date, locale),
              })}
            </p>
            {summary.firstNegativeDate ? (
              <p className="text-muted-foreground text-xs">
                {t("firstNegativeMessage", {
                  date: formatDateLabel(summary.firstNegativeDate, locale),
                })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
