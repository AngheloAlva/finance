import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUnreadAlertCount } from "@/features/alerts/lib/alerts.queries";
import { InstallPrompt } from "@/features/notifications/components/install-prompt";
import { QuickAddButton } from "@/features/transactions/components/quick-add-button";
import { AppHeader } from "@/shared/components/app-header";
import { AppSidebar } from "@/shared/components/app-sidebar";
import { CurrencyProvider } from "@/shared/components/currency-provider";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";

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

  const unreadAlertCount = await getUnreadAlertCount(session.user.id);

  const currency = (session.user.currency ?? "USD") as CurrencyCode;

  return (
    <CurrencyProvider currency={currency}>
      <SidebarProvider>
        <AppSidebar user={user} unreadAlertCount={unreadAlertCount} />
        <SidebarInset>
          <AppHeader />
          <div className="px-4 pt-2">
            <InstallPrompt />
          </div>
          <main className="flex-1 p-4">{children}</main>
          <QuickAddButton />
        </SidebarInset>
      </SidebarProvider>
    </CurrencyProvider>
  );
}
