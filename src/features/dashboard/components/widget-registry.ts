/**
 * Widget registry.
 *
 * Pure metadata about each dashboard widget — no components, no fetchers.
 * The dashboard page itself is still responsible for running the right
 * queries (because each widget has a different data signature), but this
 * registry is the single source of truth for:
 *
 * - Which widget keys exist
 * - Whether a widget can be rendered in half-width mode
 * - The i18n keys for its name and description (used by the customizer)
 *
 * Note: i18n key paths are namespaced under `dashboard.widgets.{key}`.
 */

import type { WidgetKey, WidgetSize } from "@/features/dashboard/lib/dashboard.schema";

export interface WidgetMetadata {
  key: WidgetKey;
  /** Whether the widget can be rendered at half-width. */
  supportsHalf: boolean;
  /** Default size applied when the widget is first added for a user. */
  defaultSize: WidgetSize;
}

export const WIDGET_REGISTRY: Record<WidgetKey, WidgetMetadata> = {
  overview: {
    key: "overview",
    supportsHalf: false,
    defaultSize: "full",
  },
  financialHealth: {
    key: "financialHealth",
    supportsHalf: false,
    defaultSize: "full",
  },
  monthlyDigest: {
    key: "monthlyDigest",
    supportsHalf: false,
    defaultSize: "full",
  },
  categoryBreakdown: {
    key: "categoryBreakdown",
    supportsHalf: true,
    defaultSize: "half",
  },
  monthlyFlow: {
    key: "monthlyFlow",
    supportsHalf: true,
    defaultSize: "half",
  },
  monthComparison: {
    key: "monthComparison",
    supportsHalf: false,
    defaultSize: "full",
  },
  goals: {
    key: "goals",
    supportsHalf: true,
    defaultSize: "full",
  },
  budgetSummary: {
    key: "budgetSummary",
    supportsHalf: true,
    defaultSize: "full",
  },
  portfolio: {
    key: "portfolio",
    supportsHalf: true,
    defaultSize: "full",
  },
  recentTransactions: {
    key: "recentTransactions",
    supportsHalf: false,
    defaultSize: "full",
  },
};

/** i18n key for a widget's display name. */
export function widgetNameKey(key: WidgetKey): string {
  return `dashboard.widgets.${key}.name`;
}

/** i18n key for a widget's description shown in the customizer. */
export function widgetDescriptionKey(key: WidgetKey): string {
  return `dashboard.widgets.${key}.description`;
}
