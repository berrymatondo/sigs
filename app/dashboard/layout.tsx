import type { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { requireUser } from "@/lib/session"
import { getNotifications } from "./notifications-actions"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const { notifications, unreadCount } = await getNotifications()

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <SidebarTrigger />
          <div className="h-5 w-px bg-border" />
          <span className="flex-1 text-sm font-medium text-muted-foreground">
            Système Intégré de Gestion de Services
          </span>
          <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
