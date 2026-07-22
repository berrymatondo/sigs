import Link from "next/link"
import { Plus, Rocket, TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { SearchInput } from "@/components/dashboard/search-input"
import { StatutBadge, DossierTypeBadge, DossierTypeIconTile } from "@/components/dashboard/badges"
import { StatutFilter } from "@/components/dashboard/statut-filter"
import { MiniStepper } from "@/components/dashboard/mini-stepper"
import { AvatarBadge } from "@/components/dashboard/avatar-badge"
import { DossierRowActions } from "@/components/dashboard/dossier-row-actions"
import { requireUser } from "@/lib/session"
import { formatClientName, formatDuree, roleLabels } from "@/lib/domain"
import { getDossiers, getDossiersOverview } from "./actions"

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>
}) {
  const { q, statut } = await searchParams
  const user = await requireUser()
  const [dossiers, overview] = await Promise.all([
    getDossiers(q, statut),
    getDossiersOverview(),
  ])
  const isStaff = user.role !== "VISITEUR"
  const canEdit = user.role === "ADMIN" || user.role === "MANAGER"
  const canDelete = user.role === "ADMIN"
  const canClose = isStaff

  return (
    <div>
      <PageHeader
        title="Dossiers"
        description="Suivez et gérez tous vos dossiers en un coup d'œil."
        action={
          isStaff ? (
            <Button asChild>
              <Link href="/dashboard/dossiers/nouveau">
                <Plus className="size-4" /> Nouveau dossier
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Rechercher un dossier..." />
        <StatutFilter />
      </div>

      <div className="flex flex-col gap-3">
        {dossiers.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">Aucun dossier trouvé.</Card>
        ) : (
          dossiers.map((d) => {
            const total = d.stepStates.length
            const done = d.stepStates.filter((s) => s.valide).length
            const current = d.stepStates.find((s) => !s.valide)
            const allDone = done === total
            const currentStepName = allDone ? "Terminé" : (current?.nom ?? "—")

            return (
              <Card key={d.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex items-center gap-3 lg:w-64 lg:shrink-0">
                    <DossierTypeIconTile type={d.type} />
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/dossiers/${d.id}`}
                        className="block truncate font-semibold hover:underline"
                      >
                        {d.nom}
                      </Link>
                      <p className="text-xs text-muted-foreground">{d.numero}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:w-44 lg:shrink-0">
                    <AvatarBadge name={formatClientName(d.client)} image={d.client.photo} size="size-8" />
                    <span className="truncate text-sm">{formatClientName(d.client)}</span>
                  </div>

                  <div className="lg:w-44 lg:shrink-0">
                    <DossierTypeBadge type={d.type} />
                  </div>

                  <div className="flex items-center gap-2 lg:w-44 lg:shrink-0">
                    <AvatarBadge name={d.agent?.name} image={d.agent?.image} size="size-8" />
                    <div className="min-w-0">
                      {d.agent ? (
                        <>
                          <p className="truncate text-sm font-medium">{d.agent.name}</p>
                          <p className="text-xs text-muted-foreground">{roleLabels[d.agent.role]}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Non assigné</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:w-32 lg:shrink-0">
                    <StatutBadge statut={d.statut} />
                  </div>

                  <div className="flex justify-end lg:ml-auto">
                    <DossierRowActions
                      id={d.id}
                      numero={d.numero}
                      statut={d.statut}
                      canEdit={canEdit}
                      canClose={canClose}
                      canDelete={canDelete}
                    />
                  </div>
                </div>

                {total > 0 ? (
                  <div className="flex flex-col gap-1.5 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <MiniStepper
                      totalSteps={total}
                      etapeActuelle={d.etapeActuelle}
                      isClosed={d.statut === "TERMINE" || d.statut === "ARCHIVE"}
                    />
                    <span className="text-xs text-muted-foreground">
                      {currentStepName} · Étape {Math.min(done + (allDone ? 0 : 1), total)}/{total}
                    </span>
                  </div>
                ) : null}
              </Card>
            )
          })
        )}
      </div>

      {isStaff ? (
        <Card className="mt-6 overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Rocket className="size-6" />
            </span>

            <div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <p className="text-2xl font-bold">{overview.performance}%</p>
              <p className="text-xs text-muted-foreground">Dossiers menés à terme</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Temps moyen de traitement</p>
              <p className="text-2xl font-bold">{formatDuree(Math.round(overview.tempsMoyenJours)) || "—"}</p>
              {overview.tempsMoyenDeltaPct !== null ? (
                <p
                  className={`flex items-center gap-1 text-xs ${
                    overview.tempsMoyenDeltaPct <= 0 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {overview.tempsMoyenDeltaPct <= 0 ? (
                    <TrendingDown className="size-3" />
                  ) : (
                    <TrendingUp className="size-3" />
                  )}
                  {overview.tempsMoyenDeltaPct}% vs 30 jours précédents
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Pas encore de comparaison</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Dossiers actifs</p>
              <p className="text-2xl font-bold">{overview.dossiersActifs}</p>
              <p className="text-xs text-muted-foreground">+{overview.nouveauxCeMois} ce mois-ci</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
