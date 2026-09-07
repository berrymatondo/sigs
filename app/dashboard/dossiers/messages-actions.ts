"use server"

import { prisma } from "@/lib/prisma"
import { requireUser, isStaff } from "@/lib/session"
import { notifyClientNewMessageWhatsApp } from "@/lib/whatsapp"
import { createNotification } from "@/lib/notifications"
import { revalidatePath } from "next/cache"

/**
 * Confirms the current user may read/write the given dossier's chat: staff
 * can access any dossier, a visitor only their own.
 */
async function requireDossierAccess(dossierId: string) {
  const user = await requireUser()
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: {
      id: true,
      numero: true,
      nom: true,
      agentId: true,
      client: { select: { userId: true, telephone: true, nom: true, postnom: true, prenom: true } },
    },
  })
  if (!dossier) throw new Error("Dossier introuvable.")
  if (!isStaff(user.role) && dossier.client.userId !== user.id) {
    throw new Error("Accès refusé.")
  }
  return { user, dossier }
}

export async function getMessages(dossierId: string) {
  const { user } = await requireDossierAccess(dossierId)
  const messages = await prisma.message.findMany({
    where: { dossierId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, image: true, role: true } } },
  })
  // Viewing the thread clears its unread badge, same as opening it from the bell.
  await prisma.notification.updateMany({
    where: { userId: user.id, type: "MESSAGE", lien: `/dashboard/dossiers/${dossierId}`, lu: false },
    data: { lu: true },
  })
  return { messages, currentUserId: user.id }
}

/**
 * Unread MESSAGE-notification count per dossier, for the current user, so
 * list views can badge dossiers that have an unread reply waiting.
 */
export async function getUnreadMessageCounts(): Promise<Record<string, number>> {
  const user = await requireUser()
  const rows = await prisma.notification.groupBy({
    by: ["lien"],
    where: { userId: user.id, type: "MESSAGE", lu: false, lien: { not: null } },
    _count: { _all: true },
  })
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const dossierId = row.lien?.split("/").pop()
    if (dossierId) counts[dossierId] = row._count._all
  }
  return counts
}

export async function sendMessage(dossierId: string, texte: string) {
  const { user, dossier } = await requireDossierAccess(dossierId)
  const trimmed = texte.trim()
  if (!trimmed) throw new Error("Le message ne peut pas être vide.")
  if (trimmed.length > 2000) throw new Error("Le message est trop long (2000 caractères max).")

  const message = await prisma.message.create({
    data: { dossierId, senderId: user.id, texte: trimmed },
    include: { sender: { select: { id: true, name: true, image: true, role: true } } },
  })

  const excerpt = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed
  const lien = `/dashboard/dossiers/${dossierId}`

  if (isStaff(user.role)) {
    // Let the client know a staff reply landed, both in-app and on the
    // channel they actually check day to day.
    if (dossier.client.userId) {
      await createNotification({
        userId: dossier.client.userId,
        type: "MESSAGE",
        titre: `Nouveau message — ${dossier.nom}`,
        texte: excerpt,
        lien,
      })
    }
    if (dossier.client.telephone) {
      await notifyClientNewMessageWhatsApp(dossier, trimmed)
    }
  } else if (dossier.agentId) {
    // A client wrote in: notify the agent handling the dossier.
    await createNotification({
      userId: dossier.agentId,
      type: "MESSAGE",
      titre: `Nouveau message — ${dossier.nom}`,
      texte: excerpt,
      lien,
    })
  }

  revalidatePath(`/dashboard/dossiers/${dossierId}`)
  return message
}
