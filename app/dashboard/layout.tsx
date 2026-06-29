import type { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { requireUser } from "@/lib/session"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <SidebarTrigger />
          <div className="h-5 w-px bg-border" />
          <span className="text-sm font-medium text-muted-foreground">
            Système Intégré de Gestion de Services
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
