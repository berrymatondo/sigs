import Link from "next/link"
import { Users, FolderKanban, Clock, CheckCircle2, FileText, ListTodo } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatutBadge, PrioriteBadge } from "@/components/dashboard/badges"
import { requireUser } from "@/lib/session"
import { roleLabels, dossierTypeLabels, formatClientName } from "@/lib/domain"
import { getDashboardStats, getRecentDossiers, getRecentTaches } from "./actions"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DashboardPage() {
  const user = await requireUser()
  const [stats, dossiers, taches] = await Promise.all([
    getDashboardStats(),
    getRecentDossiers(),
    getRecentTaches(),
  ])

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        description={`Vous êtes connecté en tant que ${roleLabels[user.role]}. Voici un aperçu de l'activité.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!stats.isClient && (
          <StatCard label="Clients" value={stats.totalClients} icon={Users} />
        )}
        <StatCard label="Dossiers" value={stats.totalDossiers} icon={FolderKanban} />
        <StatCard
          label="En cours"
          value={stats.dossiersEnCours}
          icon={Clock}
          accent="text-amber-600"
        />
        <StatCard
          label="Terminés / validés"
          value={stats.dossiersTermines}
          icon={CheckCircle2}
          accent="text-emerald-600"
        />
        <StatCard label="Documents" value={stats.totalDocuments} icon={FileText} accent="text-blue-600" />
        {!stats.isClient && (
          <StatCard label="Tâches actives" value={stats.tachesAFaire} icon={ListTodo} accent="text-orange-600" />
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
              dossiers.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.numero} · {dossierTypeLabels[d.type]} · {formatClientName(d.client)}
                    </p>
                  </div>
                  <StatutBadge statut={d.statut} />
                </div>
              ))
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
    </div>
  )
}
