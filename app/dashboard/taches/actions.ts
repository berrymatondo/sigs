"use server"

import { prisma } from "@/lib/prisma"
import { requireRole, requireUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getTaches(query?: string, statut?: string) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  // An AGENT only sees their own tasks plus any unassigned tasks.
  // MANAGER and ADMIN see every task.
  const scope =
    user.role === "AGENT"
      ? [{ OR: [{ agentId: user.id }, { agentId: null }] }]
      : []
  return prisma.tache.findMany({
    where: {
      AND: [
        ...scope,
        statut ? { statut: statut as never } : {},
        query ? { titre: { contains: query, mode: "insensitive" } } : {},
      ],
    },
    orderBy: [{ statut: "asc" }, { dateEcheance: "asc" }, { createdAt: "desc" }],
    include: { dossier: { include: { client: true } }, agent: { select: { name: true } } },
  })
}

// Lightweight dossier list used to populate the task creation form.
export async function getDossiersForSelect() {
  await requireRole(["MANAGER", "ADMIN"])
  return prisma.dossier.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, numero: true, nom: true },
  })
}

export type TacheInput = {
  titre: string
  description?: string
  priorite: string
  dossierId: string
  dateEcheance?: string
}

export async function createTache(data: TacheInput) {
  // Only managers and admins can create tasks.
  const user = await requireRole(["MANAGER", "ADMIN"])
  const tache = await prisma.tache.create({
    data: {
      titre: data.titre,
      description: data.description || null,
      priorite: data.priorite as never,
      dossierId: data.dossierId,
      agentId: user.id,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
    },
  })
  revalidatePath(`/dashboard/dossiers/${data.dossierId}`)
  revalidatePath("/dashboard/taches")
  return tache
}

export type TacheUpdateInput = {
  titre: string
  description?: string
  priorite: string
  statut: string
  dateEcheance?: string
  // When provided, reassigns the task. "" / null means unassigned.
  // Only applied for ADMIN users.
  agentId?: string | null
}

// Lightweight list of staff users that a task can be assigned to.
export async function getAssignableUsers() {
  await requireRole(["MANAGER", "ADMIN"])
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "MANAGER", "ADMIN"] }, banned: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  })
}

export async function updateTache(id: string, data: TacheUpdateInput) {
  // Only managers and admins can modify a task's details.
  const user = await requireRole(["MANAGER", "ADMIN"])
  if (!data.titre.trim()) throw new Error("Le titre est requis.")

  // Reassignment is an ADMIN-only capability.
  const canReassign = user.role === "ADMIN" && data.agentId !== undefined
  const agentId = data.agentId ? data.agentId : null

  const tache = await prisma.tache.update({
    where: { id },
    data: {
      titre: data.titre.trim(),
      description: data.description?.trim() || null,
      priorite: data.priorite as never,
      statut: data.statut as never,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      ...(canReassign ? { agentId } : {}),
    },
  })
  revalidatePath(`/dashboard/dossiers/${tache.dossierId}`)
  revalidatePath("/dashboard/taches")
  return tache
}

export async function updateTacheStatut(id: string, statut: string) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const tache = await prisma.tache.update({
    where: { id },
    data: { statut: statut as never },
  })
  revalidatePath(`/dashboard/dossiers/${tache.dossierId}`)
  revalidatePath("/dashboard/taches")
}

export async function deleteTache(id: string) {
  // Only administrators can delete a task.
  await requireRole(["ADMIN"])
  const tache = await prisma.tache.delete({ where: { id } })
  revalidatePath(`/dashboard/dossiers/${tache.dossierId}`)
  revalidatePath("/dashboard/taches")
}
