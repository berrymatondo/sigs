"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, isStaff } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"

export async function getDocuments(query?: string) {
  const user = await requireUser()
  const isClient = user.role === "VISITEUR"
  return prisma.document.findMany({
    where: {
      AND: [
        isClient
          ? {
              OR: [
                { dossier: { client: { userId: user.id } } },
                { client: { userId: user.id } },
              ],
            }
          : {},
        query ? { titre: { contains: query, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { dossier: { include: { client: true } }, client: true },
  })
}

export type DocumentInput = {
  titre: string
  type: string
  fichier: string
  taille?: number
  dossierId?: string
  clientId?: string
  subStepStateId?: string
  userId?: string
}

export async function createDocument(data: DocumentInput) {
  const user = await requireUser()
  if (!data.dossierId && !data.clientId && !data.userId) {
    throw new Error("Un document doit être lié à un dossier, un client ou un utilisateur.")
  }
  // Non-staff users may only: upload to a dossier they own, or attach a
  // personal document to their own profile. Staff can upload anywhere.
  if (!isStaff(user.role)) {
    if (data.userId && data.userId !== user.id) {
      throw new Error("Action non autorisée.")
    }
    if (!data.userId) {
      if (!data.dossierId) {
        throw new Error("Action non autorisée.")
      }
      const dossier = await prisma.dossier.findUnique({
        where: { id: data.dossierId },
        select: { client: { select: { userId: true } } },
      })
      if (!dossier || dossier.client.userId !== user.id) {
        throw new Error("Action non autorisée.")
      }
    }
  }
  const doc = await prisma.document.create({
    data: {
      titre: data.titre,
      type: data.type as never,
      fichier: data.fichier,
      taille: data.taille ?? 0,
      dossierId: data.dossierId || null,
      clientId: data.clientId || null,
      subStepStateId: data.subStepStateId || null,
      userId: data.userId || null,
      uploadedById: user.id,
    },
  })
  if (data.dossierId) revalidatePath(`/dashboard/dossiers/${data.dossierId}`)
  if (data.clientId) revalidatePath(`/dashboard/clients/${data.clientId}`)
  if (data.userId) revalidatePath("/dashboard/profil")
  revalidatePath("/dashboard/documents")
  return doc
}

export async function deleteDocument(id: string) {
  const user = await requireUser()
  const existing = await prisma.document.findUnique({
    where: { id },
    select: {
      uploadedById: true,
      userId: true,
      dossier: { select: { client: { select: { userId: true } } } },
    },
  })
  if (!existing) throw new Error("Document introuvable.")
  // Non-staff users can delete: their personal profile documents, or their own
  // uploads on a dossier they own. Staff can delete any document.
  if (!isStaff(user.role)) {
    const ownsPersonal = existing.userId === user.id
    const ownsDossierUpload =
      existing.dossier?.client?.userId === user.id && existing.uploadedById === user.id
    if (!ownsPersonal && !ownsDossierUpload) {
      throw new Error("Action non autorisée.")
    }
  }
  const doc = await prisma.document.delete({ where: { id } })
  // Remove the underlying blob (ignore failures / legacy URL entries).
  if (doc.fichier) {
    try {
      await del(doc.fichier)
    } catch (error) {
      console.error("[v0] Blob delete error:", error)
    }
  }
  if (doc.dossierId) revalidatePath(`/dashboard/dossiers/${doc.dossierId}`)
  if (doc.clientId) revalidatePath(`/dashboard/clients/${doc.clientId}`)
  if (doc.userId) revalidatePath("/dashboard/profil")
  revalidatePath("/dashboard/documents")
}
