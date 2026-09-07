import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Workflow,
  MessageSquare,
  Bell,
  UserCircle,
  Moon,
  Plus,
  QrCode,
  HelpCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteLogo } from "@/components/site-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDocDownloadButton } from "@/components/userdoc-download-button"
import { requireUser } from "@/lib/session"
import { USERDOC_TITLE, USERDOC_INTRO, userDocSections } from "@/lib/userdoc"
import type { LucideIcon } from "lucide-react"

export const metadata = {
  title: "Guide d'utilisation — SIGS",
  description: "Comment utiliser votre espace personnel SIGS : dossiers, messages, notifications et profil.",
}

const iconByName: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Workflow,
  MessageSquare,
  Bell,
  UserCircle,
  Moon,
  QrCode,
  HelpCircle,
}

export default async function UserDocPage() {
  await requireUser()

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <SiteLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserDocDownloadButton />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="size-4" /> Tableau de bord
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{USERDOC_TITLE}</h1>
          <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{USERDOC_INTRO}</p>
        </div>

        {/* Table of contents */}
        <Card className="mb-10">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sommaire</p>
            <nav className="flex flex-wrap gap-2">
              {userDocSections.map((s) => {
                const Icon = iconByName[s.icon] ?? HelpCircle
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                  >
                    <Icon className="size-3.5 text-primary" />
                    {s.title}
                  </a>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-10">
          {userDocSections.map((s, i) => {
            const Icon = iconByName[s.icon] ?? HelpCircle
            return (
              <section key={s.id} id={s.id} className="scroll-mt-20">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-to text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Rubrique {i + 1}</p>
                    <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                  </div>
                </div>

                <p className="mb-4 text-pretty leading-relaxed text-muted-foreground">{s.intro}</p>

                {s.tips.length > 0 ? (
                  <ul className="mb-5 flex flex-col gap-2">
                    {s.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {j + 1}
                        </span>
                        <span className="text-pretty leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.screenshot ? (
                  <figure className="overflow-hidden rounded-xl border bg-muted/30 shadow-sm">
                    <Image
                      src={s.screenshot || "/placeholder.svg"}
                      alt={s.screenshotAlt || `Capture d'écran de la rubrique ${s.title}`}
                      width={1400}
                      height={900}
                      className="h-auto w-full"
                    />
                  </figure>
                ) : null}

                {s.id === "aide" ? (
                  <p className="text-sm">
                    <Link href="/contact" className="font-medium text-primary hover:underline">
                      Ouvrir la page Contact
                    </Link>
                  </p>
                ) : null}
              </section>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild>
            <Link href="/dashboard/mes-dossiers">
              <Plus className="size-4" /> Créer ma première demande
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
