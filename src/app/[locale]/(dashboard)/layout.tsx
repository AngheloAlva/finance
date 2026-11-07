import { Suspense } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { QuickAddButton } from "@/features/transactions/components/quick-add-button"
import { AppHeader } from "@/shared/components/app-header"
import {
  DashboardCurrency,
  DashboardMobileNav,
  DashboardSidebar,
  DashboardSidebarSkeleton,
  QuickAddButtonSkeleton,
} from "@/shared/components/dashboard-shell"
import { MobileNav } from "@/shared/components/mobile-nav"

import DashboardLoading from "./loading"

// The layout itself never waits on the session or the database: the app
// chrome and skeleton stream right away, and each data-driven part fills in
// behind its own Suspense boundary (a cold database can take seconds).
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Suspense fallback={<DashboardSidebarSkeleton />}>
        <DashboardSidebar />
      </Suspense>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4">
          <Suspense fallback={<DashboardLoading />}>
            <DashboardCurrency>{children}</DashboardCurrency>
          </Suspense>
        </main>
        <Suspense fallback={<MobileNav />}>
          <DashboardMobileNav />
        </Suspense>
        <Suspense fallback={<QuickAddButtonSkeleton />}>
          {/* The Quick Add amount field formats in the user's currency. */}
          <DashboardCurrency>
            <QuickAddButton />
          </DashboardCurrency>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
