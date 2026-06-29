import { prisma } from "@/lib/prisma"

export type CompanySettings = {
  telephone: string
  whatsapp: string
  email: string
  adresse: string
  horaires: string
}

// Fallback values used if the settings row is missing for any reason.
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  telephone: "+243 81 234 56 78",
  whatsapp: "+243 99 876 54 32",
  email: "contact@sigs-agence.cd",
  adresse: "Boulevard du 30 Juin, Gombe, Kinshasa",
  horaires: "Lun - Ven, 9h - 18h",
}

const SETTINGS_ID = "default"

// Returns the editable company contact information (singleton row).
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const row = await prisma.companySettings.findUnique({ where: { id: SETTINGS_ID } })
    if (!row) return DEFAULT_COMPANY_SETTINGS
    return {
      telephone: row.telephone,
      whatsapp: row.whatsapp,
      email: row.email,
      adresse: row.adresse,
      horaires: row.horaires,
    }
  } catch {
    return DEFAULT_COMPANY_SETTINGS
  }
}
