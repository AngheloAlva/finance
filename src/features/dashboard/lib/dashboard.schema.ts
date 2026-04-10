/**
 * Dashboard customization schema.
 *
 * Stored per-user on User.dashboardConfig (Json nullable). The schema defines
 * which widgets appear on the dashboard, in what order, at what size and
 * whether they are visible at all.
 *
 * New widgets added to DEFAULT_DASHBOARD_CONFIG are automatically appended
 * to existing user configs via mergeDashboardConfig, so future additions
 * are backwards compatible.
 */

import { z } from "zod";

export const WIDGET_KEYS = [
  "overview",
  "financialHealth",
  "categoryBreakdown",
  "monthlyFlow",
  "monthComparison",
  "goals",
  "budgetSummary",
  "portfolio",
  "recentTransactions",
] as const;

export type WidgetKey = (typeof WIDGET_KEYS)[number];

export const WIDGET_SIZES = ["full", "half"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const widgetConfigSchema = z.object({
  key: z.enum(WIDGET_KEYS),
  visible: z.boolean(),
  position: z.number().int().min(0),
  size: z.enum(WIDGET_SIZES),
});

export const dashboardConfigSchema = z.object({
  widgets: z.array(widgetConfigSchema),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  widgets: [
    { key: "overview", visible: true, position: 0, size: "full" },
    { key: "financialHealth", visible: true, position: 1, size: "full" },
    { key: "categoryBreakdown", visible: true, position: 2, size: "half" },
    { key: "monthlyFlow", visible: true, position: 3, size: "half" },
    { key: "monthComparison", visible: true, position: 4, size: "full" },
    { key: "goals", visible: true, position: 5, size: "full" },
    { key: "budgetSummary", visible: true, position: 6, size: "full" },
    { key: "portfolio", visible: true, position: 7, size: "full" },
    { key: "recentTransactions", visible: true, position: 8, size: "full" },
  ],
};

/**
 * Parse a user-stored config and merge with the default.
 *
 * - Falls back to DEFAULT_DASHBOARD_CONFIG if parsing fails
 * - Appends widgets that exist in the default but are missing in the stored
 *   config (handles future widget additions for existing users)
 * - Re-normalizes positions to be contiguous ascending integers
 */
export function mergeDashboardConfig(stored: unknown): DashboardConfig {
  const parsed = dashboardConfigSchema.safeParse(stored);
  if (!parsed.success) return DEFAULT_DASHBOARD_CONFIG;

  const storedKeys = new Set(parsed.data.widgets.map((w) => w.key));
  const missing = DEFAULT_DASHBOARD_CONFIG.widgets.filter(
    (w) => !storedKeys.has(w.key),
  );

  const combined = [
    ...parsed.data.widgets,
    ...missing.map((w) => ({ ...w })),
  ];

  // Filter out any keys that are no longer valid (widget removed from registry)
  const validKeys = new Set<WidgetKey>(WIDGET_KEYS);
  const filtered = combined.filter((w) => validKeys.has(w.key));

  // Sort by current position, then reassign contiguous positions
  const sorted = filtered
    .sort((a, b) => a.position - b.position)
    .map((w, index) => ({ ...w, position: index }));

  return { widgets: sorted };
}
