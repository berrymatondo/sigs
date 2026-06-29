import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getSession } from "@/lib/session"

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated={Boolean(session?.user)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
