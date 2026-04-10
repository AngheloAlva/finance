import type { ReactNode } from "react";

import type { WidgetSize } from "@/features/dashboard/lib/dashboard.schema";

interface WidgetWrapperProps {
  size: WidgetSize;
  children: ReactNode;
}

/**
 * Grid cell wrapper that applies col-span based on the configured size.
 * Used by the dashboard page inside a `grid grid-cols-1 lg:grid-cols-2`
 * container. Mobile always stacks (single column); large screens pair
 * consecutive half widgets side-by-side.
 */
export function WidgetWrapper({ size, children }: WidgetWrapperProps) {
  return (
    <div className={size === "full" ? "lg:col-span-2" : "lg:col-span-1"}>
      {children}
    </div>
  );
}
