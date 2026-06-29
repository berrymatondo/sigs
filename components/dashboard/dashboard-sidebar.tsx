"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  ListTodo,
  LogOut,
  FolderOpen,
  UserCircle,
  Globe,
  ChevronRight,
  ShieldCheck,
  Workflow,
  BarChart3,
  BookOpen,
  MessageSquare,
  Building2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SiteLogo } from "@/components/site-logo"
import { authClient } from "@/lib/auth-client"
import { roleLabels } from "@/lib/domain"
import type { SessionUser } from "@/lib/session"

type NavItem = { title: string; href: string; icon: typeof LayoutDashboard }

const staffMain: NavItem[] = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
]
const staffGestion: NavItem[] = [
  { title: "Clients", href: "/dashboard/clients", icon: Users },
  { title: "Dossiers", href: "/dashboard/dossiers", icon: FolderKanban },
  { title: "Documents", href: "/dashboard/documents", icon: FileText },
  { title: "Tâches", href: "/dashboard/taches", icon: ListTodo },
]
// Documentation is available to all staff (agents, managers, admins).
const staffOutils: NavItem[] = [
  { title: "Documentation", href: "/dashboard/documentation", icon: BookOpen },
]
// Process layouts and analytics are reserved for managers and administrators.
const managerGestion: NavItem[] = [
  { title: "Process", href: "/dashboard/process", icon: Workflow },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

const clientMain: NavItem[] = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
]
const clientEspace: NavItem[] = [
  { title: "Mes dossiers", href: "/dashboard/mes-dossiers", icon: FolderOpen },
  { title: "Mon profil", href: "/dashboard/profil", icon: UserCircle },
]

const adminItems: NavItem[] = [
  { title: "Utilisateurs", href: "/dashboard/administration", icon: ShieldCheck },
  { title: "Avis", href: "/dashboard/avis", icon: MessageSquare },
  { title: "Coordonnées", href: "/dashboard/parametres", icon: Building2 },
]

export function DashboardSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const isClient = user.role === "VISITEUR"
  const isAdmin = user.role === "ADMIN"
  const canManage = user.role === "ADMIN" || user.role === "MANAGER"

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
  }

  function renderItems(items: NavItem[]) {
    return items.map((item) => {
      const active = isActive(item.href)
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            render={<Link href={item.href} />}
            isActive={active}
            tooltip={item.title}
            className="group/nav relative flex h-10 w-full items-center gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-all duration-200 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm data-[active=true]:shadow-sidebar-primary/30 data-[active=true]:hover:bg-sidebar-primary"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                active
                  ? "bg-white/15"
                  : "bg-sidebar-accent text-sidebar-foreground/70 group-hover/nav:bg-sidebar-primary/10 group-hover/nav:text-sidebar-primary"
              }`}
              aria-hidden
            >
              <item.icon className="size-4" />
            </span>
            <span className="flex-1">{item.title}</span>
            <ChevronRight
              className={`size-4 transition-all duration-200 ${
                active
                  ? "opacity-100"
                  : "-translate-x-1 opacity-0 group-hover/nav:translate-x-0 group-hover/nav:opacity-50"
              }`}
              aria-hidden
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })
  }

  const mainItems = isClient ? clientMain : staffMain
  const sectionLabel = isClient ? "Mon espace" : "Gestion"
  const sectionItems = isClient
    ? clientEspace
    : canManage
      ? [...staffGestion, ...managerGestion, ...staffOutils]
      : [...staffGestion, ...staffOutils]

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <SiteLogo className="text-sidebar-foreground" />
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-3">
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Aperçu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {sectionLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(sectionItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">{renderItems(adminItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/" />}
                  tooltip="Voir le site public"
                  className="group/nav flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent transition-colors duration-200 group-hover/nav:bg-sidebar-primary/10 group-hover/nav:text-sidebar-primary">
                    <Globe className="size-4 transition-transform duration-200 group-hover/nav:rotate-12" />
                  </span>
                  <span>Voir le site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{roleLabels[user.role]}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Déconnexion"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
