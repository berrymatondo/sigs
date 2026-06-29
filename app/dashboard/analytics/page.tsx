import { Suspense } from "react"
import {
  FolderKanban,
  DollarSign,
  CircleCheckBig,
  Timer,
  UserPlus,
  Activity,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { AnalyticsFilters } from "@/components/dashboard/analytics/analytics-filters"
import { KpiCard } from "@/components/dashboard/analytics/kpi-card"
import { TrendChart } from "@/components/dashboard/analytics/trend-chart"
import { StatusPieChart } from "@/components/dashboard/analytics/status-pie-chart"
import { TypeBarChart } from "@/components/dashboard/analytics/type-bar-chart"
import { RevenueChart } from "@/components/dashboard/analytics/revenue-chart"
import { ReportingTable } from "@/components/dashboard/analytics/reporting-table"
import { Skeleton } from "@/components/ui/skeleton"
import { requireRole } from "@/lib/session"
import { formatUsd } from "@/lib/domain"
import { getAnalytics } from "./actions"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>
}) {
  await requireRole(["MANAGER", "ADMIN"])
  const { period, type } = await searchParams

  return (
    <div>
      <PageHeader
        title="Analytics & Reporting"
        description="Pilotez l'activité grâce aux indicateurs clés, graphiques et synthèses de données."
        action={
          <Suspense>
            <AnalyticsFilters period={period ?? "30d"} type={type ?? "ALL"} />
          </Suspense>
        }
      />

      <Suspense
        key={`${period ?? "30d"}-${type ?? "ALL"}`}
        fallback={<AnalyticsSkeleton />}
      >
        <AnalyticsContent period={period} type={type} />
      </Suspense>
    </div>
  )
}

async function AnalyticsContent({ period, type }: { period?: string; type?: string }) {
  const data = await getAnalytics(period, type)
  const { kpis } = data

  return (
    <div className="flex flex-col gap-4">
      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total dossiers"
          value={String(kpis.totalDossiers.value)}
          icon={FolderKanban}
          delta={kpis.totalDossiers.delta}
          showDelta={kpis.comparable}
        />
        <KpiCard
          label="Chiffre d'affaires"
          value={formatUsd(kpis.chiffreAffaires.value)}
          icon={DollarSign}
          delta={kpis.chiffreAffaires.delta}
          showDelta={kpis.comparable}
        />
        <KpiCard
          label="Taux de complétion"
          value={`${kpis.tauxCompletion.value}%`}
          icon={CircleCheckBig}
          delta={kpis.tauxCompletion.delta}
          deltaSuffix=" pts"
          showDelta={kpis.comparable}
        />
        <KpiCard
          label="Délai moyen"
          value={`${kpis.delaiMoyen.value} j`}
          icon={Timer}
          showDelta={false}
          hint="traitement"
          positiveIsGood={false}
        />
        <KpiCard
          label="Nouveaux clients"
          value={String(kpis.nouveauxClients.value)}
          icon={UserPlus}
          delta={kpis.nouveauxClients.delta}
          showDelta={kpis.comparable}
        />
        <KpiCard
          label="Dossiers actifs"
          value={String(kpis.dossiersActifs.value)}
          icon={Activity}
          showDelta={false}
          hint="en cours"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TrendChart data={data.timeseries} />
        <StatusPieChart data={data.parStatut} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart data={data.timeseries} />
        <TypeBarChart data={data.parType} />
      </div>

      {/* Reporting table */}
      <ReportingTable rows={data.reporting} totals={data.totals} />
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
      <Skeleton className="h-[280px] rounded-xl" />
    </div>
  )
}
