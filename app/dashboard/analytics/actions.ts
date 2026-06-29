"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { dossierTypeLabels, dossierStatutLabels } from "@/lib/domain"
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/lib/analytics-config"

const REALIZED_STATUTS = ["VALIDE", "TERMINE"]
const ACTIVE_STATUTS = ["EN_ATTENTE", "EN_COURS", "DOCUMENTS_MANQUANTS"]

type Granularity = "day" | "week" | "month"

const PERIOD_DAYS: Record<Exclude<AnalyticsPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
}

const PERIOD_GRANULARITY: Record<AnalyticsPeriod, Granularity> = {
  "7d": "day",
  "30d": "day",
  "90d": "week",
  "12m": "month",
  all: "month",
}

function startOfBucket(date: Date, granularity: Granularity) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (granularity === "month") {
    d.setDate(1)
  } else if (granularity === "week") {
    const dow = (d.getDay() + 6) % 7 // Monday = 0
    d.setDate(d.getDate() - dow)
  }
  return d
}

function advance(date: Date, granularity: Granularity) {
  const d = new Date(date)
  if (granularity === "day") d.setDate(d.getDate() + 1)
  else if (granularity === "week") d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  return d
}

function bucketLabel(date: Date, granularity: Granularity) {
  if (granularity === "month") {
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(date)
  }
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date)
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>

export async function getAnalytics(periodInput?: string, typeInput?: string) {
  await requireRole(["MANAGER", "ADMIN"])

  const period = (ANALYTICS_PERIODS.find((p) => p.value === periodInput)?.value ??
    "30d") as AnalyticsPeriod
  const type =
    typeInput && typeInput in dossierTypeLabels ? typeInput : "ALL"

  const now = new Date()
  const granularity = PERIOD_GRANULARITY[period]

  // Compute current + previous comparison windows.
  let start: Date | null = null
  let prevStart: Date | null = null
  let prevEnd: Date | null = null
  if (period !== "all") {
    const days = PERIOD_DAYS[period]
    start = new Date(now)
    start.setDate(start.getDate() - days)
    prevEnd = new Date(start)
    prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - days)
  }

  const typeWhere = type === "ALL" ? {} : { type: type as never }

  // Fetch the data we need in as few queries as possible.
  const [dossiers, prevDossiers, clientsInPeriod, prevClients] = await Promise.all([
    prisma.dossier.findMany({
      where: { ...typeWhere, ...(start ? { createdAt: { gte: start } } : {}) },
      select: { type: true, statut: true, montant: true, createdAt: true, updatedAt: true },
    }),
    prevStart && prevEnd
      ? prisma.dossier.findMany({
          where: { ...typeWhere, createdAt: { gte: prevStart, lt: prevEnd } },
          select: { statut: true, montant: true },
        })
      : Promise.resolve([]),
    prisma.client.count({
      where: { archived: false, ...(start ? { createdAt: { gte: start } } : {}) },
    }),
    prevStart && prevEnd
      ? prisma.client.count({
          where: { archived: false, createdAt: { gte: prevStart, lt: prevEnd } },
        })
      : Promise.resolve(0),
  ])

  // ---- KPIs ----
  const totalDossiers = dossiers.length
  const realized = dossiers.filter((d) => REALIZED_STATUTS.includes(d.statut))
  const active = dossiers.filter((d) => ACTIVE_STATUTS.includes(d.statut))
  const chiffreAffaires = realized.reduce((sum, d) => sum + (d.montant ?? 0), 0)
  const tauxCompletion =
    totalDossiers === 0 ? 0 : Math.round((realized.length / totalDossiers) * 1000) / 10

  const delais = realized
    .map((d) => (d.updatedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    .filter((v) => v >= 0)
  const delaiMoyen =
    delais.length === 0
      ? 0
      : Math.round((delais.reduce((a, b) => a + b, 0) / delais.length) * 10) / 10

  // Previous window aggregates for trend deltas.
  const prevTotal = prevDossiers.length
  const prevRealized = prevDossiers.filter((d) => REALIZED_STATUTS.includes(d.statut))
  const prevCa = prevRealized.reduce((sum, d) => sum + (d.montant ?? 0), 0)
  const prevTaux =
    prevTotal === 0 ? 0 : Math.round((prevRealized.length / prevTotal) * 1000) / 10

  const kpis = {
    totalDossiers: { value: totalDossiers, delta: pctDelta(totalDossiers, prevTotal) },
    chiffreAffaires: { value: chiffreAffaires, delta: pctDelta(chiffreAffaires, prevCa) },
    tauxCompletion: { value: tauxCompletion, delta: Math.round((tauxCompletion - prevTaux) * 10) / 10 },
    delaiMoyen: { value: delaiMoyen, delta: 0 },
    nouveauxClients: { value: clientsInPeriod, delta: pctDelta(clientsInPeriod, prevClients) },
    dossiersActifs: { value: active.length, delta: 0 },
    comparable: period !== "all",
  }

  // ---- Time series (créés vs terminés + CA) ----
  const seriesStart = start
    ? startOfBucket(start, granularity)
    : startOfBucket(
        dossiers.reduce(
          (min, d) => (d.createdAt < min ? d.createdAt : min),
          dossiers[0]?.createdAt ?? now,
        ),
        granularity,
      )

  const buckets: { key: string; date: Date }[] = []
  for (let cur = new Date(seriesStart); cur <= now; cur = advance(cur, granularity)) {
    buckets.push({ key: cur.toISOString(), date: new Date(cur) })
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]))
  const timeseries = buckets.map((b) => ({
    label: bucketLabel(b.date, granularity),
    crees: 0,
    termines: 0,
    ca: 0,
  }))
  for (const d of dossiers) {
    const key = startOfBucket(d.createdAt, granularity).toISOString()
    const idx = bucketIndex.get(key)
    if (idx === undefined) continue
    timeseries[idx].crees += 1
    if (REALIZED_STATUTS.includes(d.statut)) {
      timeseries[idx].termines += 1
      timeseries[idx].ca += d.montant ?? 0
    }
  }

  // ---- Distribution par type ----
  const parTypeMap = new Map<string, { count: number; revenue: number; realized: number }>()
  for (const d of dossiers) {
    const entry = parTypeMap.get(d.type) ?? { count: 0, revenue: 0, realized: 0 }
    entry.count += 1
    if (REALIZED_STATUTS.includes(d.statut)) {
      entry.revenue += d.montant ?? 0
      entry.realized += 1
    }
    parTypeMap.set(d.type, entry)
  }
  const parType = Array.from(parTypeMap.entries())
    .map(([key, v]) => ({
      key,
      label: dossierTypeLabels[key] ?? key,
      count: v.count,
      revenue: v.revenue,
      realized: v.realized,
    }))
    .sort((a, b) => b.count - a.count)

  // ---- Distribution par statut ----
  const parStatutMap = new Map<string, number>()
  for (const d of dossiers) {
    parStatutMap.set(d.statut, (parStatutMap.get(d.statut) ?? 0) + 1)
  }
  const parStatut = Array.from(parStatutMap.entries())
    .map(([key, count]) => ({ key, label: dossierStatutLabels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count)

  // ---- Reporting table ----
  const reporting = parType.map((t) => ({
    key: t.key,
    label: t.label,
    total: t.count,
    termines: t.realized,
    tauxCompletion: t.count === 0 ? 0 : Math.round((t.realized / t.count) * 1000) / 10,
    ca: t.revenue,
    panierMoyen: t.realized === 0 ? 0 : Math.round(t.revenue / t.realized),
  }))

  return {
    period,
    type,
    granularity,
    kpis,
    timeseries,
    parType,
    parStatut,
    reporting,
    totals: {
      total: totalDossiers,
      termines: realized.length,
      ca: chiffreAffaires,
      panierMoyen: realized.length === 0 ? 0 : Math.round(chiffreAffaires / realized.length),
    },
  }
}
