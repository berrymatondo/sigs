"use server"

import { getCompanySettings } from "@/lib/company-settings"
import { sendContactEmails } from "@/lib/email"

export type ContactState = { ok: boolean; message: string } | null

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const nom = String(formData.get("nom") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const telephone = String(formData.get("telephone") ?? "").trim()
  const sujet = String(formData.get("sujet") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()

  if (!nom || !email || !sujet || !message) {
    return { ok: false, message: "Veuillez remplir tous les champs obligatoires." }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Adresse email invalide." }
  }

  // Send the message to the company contact email and an acknowledgement to the visitor.
  const settings = await getCompanySettings()
  await sendContactEmails({ nom, email, telephone, sujet, message, companyEmail: settings.email })

  return {
    ok: true,
    message: "Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.",
  }
}
