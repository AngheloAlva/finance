"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLocale, useTranslations } from "next-intl";

import type { CurrencyCode } from "@/shared/lib/constants";
import { formatCurrency } from "@/shared/lib/formatters";

import type { ProjectionPoint } from "@/features/analytics/types/analytics.types";

const CHART_COLORS = {
  line: "var(--color-blue-500)",
  positive: "var(--color-emerald-500)",
  negative: "var(--color-red-500)",
  grid: "var(--color-border)",
  text: "var(--color-muted-foreground)",
  reference: "var(--color-muted-foreground)",
  zero: "var(--color-red-500)",
} as const;

interface CashflowProjectionChartProps {
  data: ProjectionPoint[];
  currency: CurrencyCode;
  horizons?: number[];
}

interface TooltipPayloadItem {
  payload: ProjectionPoint;
}

function formatDayLabel(dateKey: string, locale: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function CustomTooltip({
  active,
  payload,
  currency,
  locale,
  t,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  currency: CurrencyCode;
  locale: string;
  t: (key: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{formatDayLabel(point.date, locale)}</p>
      <p
        style={{
          color: point.isNegative ? CHART_COLORS.negative : CHART_COLORS.line,
        }}
      >
        {t("balance")}: {formatCurrency(point.balance, currency, locale)}
      </p>
      {point.dayInflow > 0 ? (
        <p style={{ color: CHART_COLORS.positive }}>
          + {formatCurrency(point.dayInflow, currency, locale)}
        </p>
      ) : null}
      {point.dayOutflow > 0 ? (
        <p style={{ color: CHART_COLORS.negative }}>
          - {formatCurrency(point.dayOutflow, currency, locale)}
        </p>
      ) : null}
    </div>
  );
}

export function CashflowProjectionChart({
  data,
  currency,
  horizons = [30, 60, 90],
}: CashflowProjectionChartProps) {
  const t = useTranslations("projection");
  const locale = useLocale();

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <p className="text-muted-foreground text-sm">{t("noData")}</p>
      </div>
    );
  }

  // Enrich with split series so the line renders red when negative and
  // blue/emerald when positive. Recharts draws null gaps, so we mirror the
  // balance into two optional series that only carry a value on one side.
  const enriched = data.map((p) => ({
    ...p,
    balancePositive: p.balance >= 0 ? p.balance : null,
    balanceNegative: p.balance < 0 ? p.balance : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={enriched} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="dayOffset"
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `+${value}d`}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCurrency(value, currency, locale)}
          width={80}
        />
        <Tooltip
          content={
            <CustomTooltip
              currency={currency}
              locale={locale}
              t={(key) => t(key)}
            />
          }
        />

        {/* Zero baseline */}
        <ReferenceLine
          y={0}
          stroke={CHART_COLORS.zero}
          strokeDasharray="4 4"
          strokeOpacity={0.6}
        />

        {/* 30 / 60 / 90 day markers */}
        {horizons.map((offset) => (
          <ReferenceLine
            key={offset}
            x={offset}
            stroke={CHART_COLORS.reference}
            strokeDasharray="2 4"
            strokeOpacity={0.5}
            label={{
              value: `${offset}d`,
              position: "top",
              fill: CHART_COLORS.text,
              fontSize: 11,
            }}
          />
        ))}

        {/* Positive zone tint */}
        <Area
          type="monotone"
          dataKey="balancePositive"
          stroke="none"
          fill={CHART_COLORS.positive}
          fillOpacity={0.08}
          connectNulls={false}
          isAnimationActive={false}
        />

        {/* Negative zone tint */}
        <Area
          type="monotone"
          dataKey="balanceNegative"
          stroke="none"
          fill={CHART_COLORS.negative}
          fillOpacity={0.12}
          connectNulls={false}
          isAnimationActive={false}
        />

        {/* Main balance line */}
        <Line
          type="monotone"
          dataKey="balance"
          stroke={CHART_COLORS.line}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
