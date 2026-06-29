"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function getDashboardStats() {
  const user = await requireUser()
  const isClient = user.role === "VISITEUR"

  // Visitors only see dossiers attached to their own client record
  const dossierWhere = isClient ? { client: { userId: user.id } } : {}

  const [
    totalClients,
    totalDossiers,
    dossiersEnCours,
    dossiersTermines,
    totalDocuments,
    tachesAFaire,
  ] = await Promise.all([
    isClient ? Promise.resolve(0) : prisma.client.count({ where: { archived: false } }),
    prisma.dossier.count({ where: dossierWhere }),
    prisma.dossier.count({ where: { ...dossierWhere, statut: { in: ["EN_ATTENTE", "EN_COURS", "DOCUMENTS_MANQUANTS"] } } }),
    prisma.dossier.count({ where: { ...dossierWhere, statut: { in: ["TERMINE", "VALIDE"] } } }),
    prisma.document.count({ where: isClient ? { dossier: { client: { userId: user.id } } } : {} }),
    isClient
      ? Promise.resolve(0)
      : prisma.tache.count({ where: { statut: { in: ["A_FAIRE", "EN_COURS"] } } }),
  ])

  return {
    totalClients,
    totalDossiers,
    dossiersEnCours,
    dossiersTermines,
    totalDocuments,
    tachesAFaire,
    isClient,
  }
}

export async function getRecentDossiers() {
  const user = await requireUser()
  const isClient = user.role === "VISITEUR"

  return prisma.dossier.findMany({
    where: isClient ? { client: { userId: user.id } } : {},
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { client: true },
  })
}

export async function getRecentTaches() {
  const user = await requireUser()
  if (user.role === "VISITEUR") return []

  return prisma.tache.findMany({
    where: { statut: { in: ["A_FAIRE", "EN_COURS"] } },
    orderBy: [{ dateEcheance: "asc" }, { createdAt: "desc" }],
    take: 6,
    include: { dossier: { include: { client: true } } },
  })
}
