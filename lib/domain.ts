import QRCode from "qrcode"

export const DOSSIER_TYPES = [
  "VISA",
  "LOCATION_VOITURE",
  "ASSURANCE_VOYAGE",
  "RESERVATION_HOTEL",
  "PASSEPORT",
  "AUTRE",
] as const

export const DOSSIER_STATUTS = [
  "BROUILLON",
  "EN_ATTENTE",
  "DOCUMENTS_MANQUANTS",
  "EN_COURS",
  "VALIDE",
  "REFUSE",
  "TERMINE",
  "ARCHIVE",
] as const

export const DOCUMENT_TYPES = ["PDF", "WORD", "EXCEL", "JPEG", "PNG", "AUTRE"] as const

export const TACHE_PRIORITES = ["BASSE", "NORMALE", "HAUTE", "URGENTE"] as const

export const TACHE_STATUTS = ["A_FAIRE", "EN_COURS", "TERMINEE", "ANNULEE"] as const

export const dossierTypeLabels: Record<string, string> = {
  VISA: "Demande Visa",
  LOCATION_VOITURE: "Location Voiture",
  ASSURANCE_VOYAGE: "Assurance Voyage",
  RESERVATION_HOTEL: "Réservation Hôtel",
  PASSEPORT: "Demande Passeport",
  AUTRE: "Autre service",
}

export const dossierStatutLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  DOCUMENTS_MANQUANTS: "Documents manquants",
  EN_COURS: "En cours",
  VALIDE: "Validé",
  REFUSE: "Refusé",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé",
}

export const dossierStatutColors: Record<string, string> = {
  BROUILLON: "bg-muted text-muted-foreground",
  EN_ATTENTE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DOCUMENTS_MANQUANTS: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  EN_COURS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  VALIDE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REFUSE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  TERMINE: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  ARCHIVE: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
}

export const prioriteLabels: Record<string, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
}

export const prioriteColors: Record<string, string> = {
  BASSE: "bg-muted text-muted-foreground",
  NORMALE: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HAUTE: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  URGENTE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const tacheStatutLabels: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
}

export const roleLabels: Record<string, string> = {
  VISITEUR: "Visiteur",
  AGENT: "Agent",
  MANAGER: "Manager",
  ADMIN: "Administrateur",
}

export const ROLES = ["VISITEUR", "AGENT", "MANAGER", "ADMIN"] as const

export const roleColors: Record<string, string> = {
  VISITEUR: "bg-muted text-muted-foreground",
  AGENT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  MANAGER: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ADMIN: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
}

export function formatClientName(client: {
  nom: string
  postnom?: string | null
  prenom?: string | null
}) {
  return [client.nom, client.postnom, client.prenom]
    .filter((part) => part && String(part).trim().length > 0)
    .join(" ")
}

export function formatDuree(jours: number) {
  if (!jours || jours <= 0) return "—"
  if (jours < 7) return `${jours} jour${jours > 1 ? "s" : ""}`
  if (jours < 30) {
    const weeks = Math.round(jours / 7)
    return `${weeks} semaine${weeks > 1 ? "s" : ""}`
  }
  const months = Math.round(jours / 30)
  return `${months} mois`
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

export function generateDossierNumero() {
  const year = new Date().getFullYear()
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `DOS-${year}-${rand}`
}

export async function generateQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  })
}
