import Link from "next/link"
import { Plus, Workflow, Clock, Banknote, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProcessRowActions } from "@/components/dashboard/process-row-actions"
import { requireRole } from "@/lib/session"
import { formatDuree, formatUsd } from "@/lib/domain"
import { getProcessDefinitions } from "./actions"

export default async function ProcessPage() {
  const user = await requireRole(["MANAGER", "ADMIN"])
  const processes = await getProcessDefinitions()
  const isAdmin = user.role === "ADMIN"

  return (
    <div>
      <PageHeader
        title="Process"
        description="Définissez les modèles de process (étapes et sous-étapes) suivis par les dossiers."
        action={
          <Button asChild>
            <Link href="/dashboard/process/nouveau">
              <Plus className="size-4" /> Nouveau process
            </Link>
          </Button>
        }
      />

      {processes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Workflow className="size-6 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">
              Aucun process défini. Créez votre premier modèle de process.
            </p>
            <Button asChild>
              <Link href="/dashboard/process/nouveau">
                <Plus className="size-4" /> Nouveau process
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((p) => (
            <Card key={p.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.actif
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.actif ? "Actif" : "Inactif"}
                    </span>
                    {p.openInstances > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Lock className="size-3" /> {p.openInstances} en cours
                      </span>
                    )}
                  </div>
                  <ProcessRowActions
                    id={p.id}
                    actif={p.actif}
                    locked={p.openInstances > 0}
                    canDelete={isAdmin && p._count.dossiers === 0}
                  />
                </div>

                <Link href={`/dashboard/process/${p.id}`} className="space-y-1">
                  <h3 className="font-semibold leading-tight text-balance group-hover:underline">
                    {p.nom}
                  </h3>
                  {p.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
                      {p.description}
                    </p>
                  ) : null}
                </Link>

                <div className="mt-auto flex flex-wrap gap-3 border-t pt-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Workflow className="size-4" /> {p._count.steps} étape{p._count.steps > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" /> {formatDuree(p.dureeJours)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Banknote className="size-4" /> {formatUsd(p.cout)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
