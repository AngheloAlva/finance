import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUnreadAlertCount } from "@/features/alerts/lib/alerts.queries";
import { QuickAddButton } from "@/features/transactions/components/quick-add-button";
import { AppHeader } from "@/shared/components/app-header";
import { AppSidebar } from "@/shared/components/app-sidebar";
import { MobileNav } from "@/shared/components/mobile-nav";
import { CurrencyProvider } from "@/shared/components/currency-provider";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";
import { prisma } from "@/shared/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  const [alertCount, preferences] = await Promise.all([
    getUnreadAlertCount(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { simpleMode: true },
    }),
  ]);
  const simpleMode = preferences?.simpleMode ?? false;
  // Alerts are hidden in simple mode, so their badge would point nowhere.
  const unreadAlertCount = simpleMode ? 0 : alertCount;

  const currency = (session.user.currency ?? "USD") as CurrencyCode;

  return (
    <CurrencyProvider currency={currency}>
      <SidebarProvider>
        <AppSidebar user={user} unreadAlertCount={unreadAlertCount} simpleMode={simpleMode} />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4">
            {children}
          </main>
          <MobileNav unreadAlertCount={unreadAlertCount} />
          <QuickAddButton />
        </SidebarInset>
      </SidebarProvider>
    </CurrencyProvider>
  );
}
