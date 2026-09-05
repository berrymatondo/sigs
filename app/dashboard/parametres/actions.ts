"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type SettingsState = { ok: boolean; message: string } | null

const SETTINGS_ID = "default"

// Updates the editable company contact information shown on the /contact page.
export async function updateCompanySettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireRole(["ADMIN"])

  const telephone = String(formData.get("telephone") ?? "").trim()
  const whatsapp = String(formData.get("whatsapp") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const adresse = String(formData.get("adresse") ?? "").trim()
  const horaires = String(formData.get("horaires") ?? "").trim()

  if (!telephone || !whatsapp || !email || !adresse || !horaires) {
    return { ok: false, message: "Tous les champs sont obligatoires." }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Adresse email invalide." }
  }

  const data = { telephone, whatsapp, email, adresse, horaires }
  await prisma.companySettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  })

  revalidatePath("/dashboard/parametres")
  revalidatePath("/contact")

  return { ok: true, message: "Coordonnées mises à jour avec succès." }
}
