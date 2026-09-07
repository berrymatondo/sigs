import Link from "next/link"
import {
  Users,
  FolderKanban,
  Clock,
  CheckCircle2,
  FileText,
  ListTodo,
  DollarSign,
  UserPlus,
  Activity,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatutBadge, PrioriteBadge, DossierTypeIconTile } from "@/components/dashboard/badges"
import { MiniStepper } from "@/components/dashboard/mini-stepper"
import { KpiCard } from "@/components/dashboard/analytics/kpi-card"
import { TrendChart } from "@/components/dashboard/analytics/trend-chart"
import { StatusPieChart } from "@/components/dashboard/analytics/status-pie-chart"
import { requireUser } from "@/lib/session"
import { roleLabels, dossierTypeLabels, formatClientName, formatUsd } from "@/lib/domain"
import { getDashboardStats, getRecentDossiers, getRecentTaches } from "./actions"
import { getAnalytics } from "./analytics/actions"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DashboardPage() {
  const user = await requireUser()
  const isAdmin = user.role === "ADMIN"
  const [stats, dossiers, taches, analytics] = await Promise.all([
    getDashboardStats(),
    getRecentDossiers(),
    getRecentTaches(),
    isAdmin ? getAnalytics("30d", "ALL") : Promise.resolve(null),
  ])

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        description={`Vous êtes connecté en tant que ${roleLabels[user.role]}. Voici un aperçu de l'activité.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!stats.isClient && (
          <StatCard
            label="Clients"
            value={stats.totalClients}
            icon={Users}
            tint="bg-primary/10"
          />
        )}
        <StatCard label="Dossiers" value={stats.totalDossiers} icon={FolderKanban} tint="bg-primary/10" />
        <StatCard
          label="En cours"
          value={stats.dossiersEnCours}
          icon={Clock}
          accent="text-amber-600"
          tint="bg-amber-100 dark:bg-amber-950/40"
        />
        <StatCard
          label="Terminés / validés"
          value={stats.dossiersTermines}
          icon={CheckCircle2}
          accent="text-emerald-600"
          tint="bg-emerald-100 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Documents"
          value={stats.totalDocuments}
          icon={FileText}
          accent="text-blue-600"
          tint="bg-blue-100 dark:bg-blue-950/40"
        />
        {!stats.isClient && (
          <StatCard
            label="Tâches actives"
            value={stats.tachesAFaire}
            icon={ListTodo}
            accent="text-orange-600"
            tint="bg-orange-100 dark:bg-orange-950/40"
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dossiers récents</CardTitle>
            <Link href={stats.isClient ? "/dashboard/mes-dossiers" : "/dashboard/dossiers"} className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dossiers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun dossier pour le moment.</p>
            ) : (
              dossiers.map((d) => {
                const totalSteps = d.processDefinition?._count.steps ?? 0
                return (
                  <Link
                    key={d.id}
                    href={`/dashboard/dossiers/${d.id}`}
                    className="flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-secondary"
                  >
                    <DossierTypeIconTile type={d.type} className="size-9 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.nom}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {d.numero} · {dossierTypeLabels[d.type]}
                            {stats.isClient ? "" : ` · ${formatClientName(d.client)}`}
                          </p>
                        </div>
                        <StatutBadge statut={d.statut} />
                      </div>
                      {totalSteps > 0 ? (
                        <MiniStepper
                          totalSteps={totalSteps}
                          etapeActuelle={d.etapeActuelle}
                          isClosed={d.statut === "TERMINE" || d.statut === "ARCHIVE"}
                          className="mt-2"
                        />
                      ) : null}
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        {!stats.isClient && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tâches à traiter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taches.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche en attente.</p>
              ) : (
                taches.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.titre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.dossier.numero}
                        {t.dateEcheance
                          ? ` · échéance ${formatDistanceToNow(t.dateEcheance, { addSuffix: true, locale: fr })}`
                          : ""}
                      </p>
                    </div>
                    <PrioriteBadge priorite={t.priorite} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && analytics ? (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Vue stratégique</h2>
              <p className="text-sm text-muted-foreground">
                Tendances des 30 derniers jours, tous services confondus.
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Analytique complète <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Chiffre d'affaires"
              value={formatUsd(analytics.kpis.chiffreAffaires.value)}
              icon={DollarSign}
              delta={analytics.kpis.chiffreAffaires.delta}
              showDelta={analytics.kpis.comparable}
            />
            <KpiCard
              label="Taux de complétion"
              value={`${analytics.kpis.tauxCompletion.value}%`}
              icon={CheckCircle2}
              delta={analytics.kpis.tauxCompletion.delta}
              deltaSuffix=" pts"
              showDelta={analytics.kpis.comparable}
            />
            <KpiCard
              label="Nouveaux clients"
              value={String(analytics.kpis.nouveauxClients.value)}
              icon={UserPlus}
              delta={analytics.kpis.nouveauxClients.delta}
              showDelta={analytics.kpis.comparable}
            />
            <KpiCard
              label="Dossiers actifs"
              value={String(analytics.kpis.dossiersActifs.value)}
              icon={Activity}
              showDelta={false}
              hint="en cours"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <TrendChart data={analytics.timeseries} />
            <StatusPieChart data={analytics.parStatut} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
