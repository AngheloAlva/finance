import type { DateRangePreset } from "@/features/analytics/types/analytics.types";

interface ScoreThreshold {
  threshold: number;
  score: number;
}

export function computeHealthSubScore(
  value: number,
  thresholds: ScoreThreshold[],
): number {
  // Thresholds must be sorted descending by threshold
  const sorted = [...thresholds].sort((a, b) => b.threshold - a.threshold);

  for (let i = 0; i < sorted.length; i++) {
    if (value >= sorted[i].threshold) {
      // If first threshold, return its score
      if (i === 0) return sorted[i].score;

      // Linear interpolation between this and the previous threshold
      const upper = sorted[i - 1];
      const lower = sorted[i];
      const ratio = (value - lower.threshold) / (upper.threshold - lower.threshold);
      return lower.score + ratio * (upper.score - lower.score);
    }
  }

  return sorted[sorted.length - 1].score;
}

export function getDateRangePresets(): DateRangePreset[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      label: "Last 30 days",
      value: "30d",
      from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: today,
    },
    {
      label: "Last 3 months",
      value: "3m",
      from: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
      to: today,
    },
    {
      label: "Last 6 months",
      value: "6m",
      from: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()),
      to: today,
    },
    {
      label: "Last 12 months",
      value: "12m",
      from: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
      to: today,
    },
    {
      label: "Year to date",
      value: "ytd",
      from: new Date(today.getFullYear(), 0, 1),
      to: today,
    },
  ];
}

export function formatDateRange(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(from)} - ${fmt.format(to)}`;
}

export function clampDateRange(
  from: Date,
  to: Date,
  maxDays: number,
): { from: Date; to: Date } {
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  const diff = to.getTime() - from.getTime();

  if (diff > maxMs) {
    return { from: new Date(to.getTime() - maxMs), to };
  }

  return { from, to };
}

export function parseDateRange(
  searchParams: Record<string, string | string[] | undefined>,
): { from: Date; to: Date; preset: string } {
  const rawFrom = typeof searchParams.from === "string" ? searchParams.from : null;
  const rawTo = typeof searchParams.to === "string" ? searchParams.to : null;
  const rawPreset = typeof searchParams.preset === "string" ? searchParams.preset : null;

  // If a preset is specified, use it
  if (rawPreset) {
    const presets = getDateRangePresets();
    const matched = presets.find((p) => p.value === rawPreset);
    if (matched) {
      return { from: matched.from, to: matched.to, preset: matched.value };
    }
  }

  // If custom dates are specified
  if (rawFrom && rawTo) {
    const from = new Date(rawFrom);
    const to = new Date(rawTo);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from, to, preset: "custom" };
    }
  }

  // Default: last 12 months
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    from: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
    to: today,
    preset: "12m",
  };
}
