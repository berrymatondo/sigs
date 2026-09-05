import { dossierStatutLabels, formatClientName } from "@/lib/domain"

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) {
    console.log("[v0] WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID manquant — notification WhatsApp ignorée")
    return null
  }
  return { accessToken, phoneNumberId }
}

/**
 * Converts a locally formatted DRC number ("099 601 8000", "+243 99 601 8000",
 * "243996018000"...) to the digits-only country-code-prefixed format the
 * WhatsApp Cloud API expects. A leading trunk "0" (the local DRC dialing
 * prefix) is replaced with the DRC country code 243; numbers that already
 * carry a country code are left as-is.
 */
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "")
  if (!digits) return null
  if (digits.startsWith("+")) return digits.slice(1)
  if (digits.startsWith("243")) return digits
  if (digits.startsWith("0")) return `243${digits.slice(1)}`
  return digits
}

/**
 * Sends a free-form WhatsApp text message via the Meta Cloud API. Returns
 * true when the message was accepted, false otherwise (not configured,
 * invalid number, or the API call failed) so callers can degrade silently.
 *
 * Note: outside the 24h customer-service window, WhatsApp only allows
 * business-initiated messages that use a pre-approved template. This sends a
 * plain text message, which works within an active conversation window; once
 * a message template is approved in Meta Business Manager, swap the request
 * body below for a `type: "template"` payload.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false
  const number = toWhatsAppNumber(to)
  if (!number) {
    console.log("[v0] Numéro WhatsApp invalide, notification ignorée:", to)
    return false
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "text",
        text: { body },
      }),
    })
    if (!res.ok) {
      console.log("[v0] Échec de l'envoi WhatsApp:", res.status, await res.text())
      return false
    }
    return true
  } catch (error) {
    console.log("[v0] Échec de l'envoi WhatsApp:", (error as Error).message)
    return false
  }
}

type DossierForWhatsApp = {
  numero: string
  nom: string
  client: {
    nom: string
    postnom?: string | null
    prenom?: string | null
    telephone?: string | null
  }
}

/**
 * Notifies the client that their dossier's status just changed. No-op when
 * the client has no phone number on file or WhatsApp isn't configured.
 */
export async function notifyClientStatutChangeWhatsApp(
  dossier: DossierForWhatsApp,
  nouveauStatut: string,
): Promise<boolean> {
  if (!dossier.client.telephone) return false
  const clientName = formatClientName(dossier.client)
  const statutLabel = dossierStatutLabels[nouveauStatut] ?? nouveauStatut
  const body =
    `Bonjour ${clientName}, le statut de votre dossier ${dossier.numero} (${dossier.nom}) ` +
    `vient de passer à : *${statutLabel}*.\n\nSuivez son avancement depuis votre espace SIGS.`
  return sendWhatsAppText(dossier.client.telephone, body)
}

/**
 * Notifies the client that their agent replied in the dossier's chat. No-op
 * when the client has no phone number on file or WhatsApp isn't configured.
 */
export async function notifyClientNewMessageWhatsApp(
  dossier: DossierForWhatsApp,
  texte: string,
): Promise<boolean> {
  if (!dossier.client.telephone) return false
  const clientName = formatClientName(dossier.client)
  const excerpt = texte.length > 200 ? `${texte.slice(0, 200)}…` : texte
  const body =
    `Bonjour ${clientName}, vous avez un nouveau message concernant votre dossier ${dossier.numero} ` +
    `(${dossier.nom}) :\n\n« ${excerpt} »\n\nRépondez depuis votre espace SIGS.`
  return sendWhatsAppText(dossier.client.telephone, body)
}
