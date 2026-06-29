"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type AvisState = { ok: boolean; message: string } | null

// Public list of reviews shown on the landing page (newest first).
export async function getAvis() {
  return prisma.avis.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  })
}

export async function submitAvis(
  _prev: AvisState,
  formData: FormData,
): Promise<AvisState> {
  const nom = String(formData.get("nom") ?? "").trim()
  const role = String(formData.get("role") ?? "").trim()
  const texte = String(formData.get("texte") ?? "").trim()
  const noteRaw = Number(formData.get("note") ?? 5)

  if (!nom || !texte) {
    return { ok: false, message: "Veuillez indiquer votre nom et votre commentaire." }
  }
  if (texte.length > 500) {
    return { ok: false, message: "Votre commentaire est trop long (500 caractères max)." }
  }
  const note = Number.isFinite(noteRaw) ? Math.min(5, Math.max(1, Math.round(noteRaw))) : 5

  // Link the review to the account if the visitor is authenticated.
  const user = await getCurrentUser()

  await prisma.avis.create({
    data: {
      nom,
      role: role || null,
      texte,
      note,
      userId: user?.id ?? null,
    },
  })

  revalidatePath("/")
  return { ok: true, message: "Merci ! Votre avis a bien été publié." }
}
