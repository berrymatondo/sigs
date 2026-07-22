import { prisma } from "@/lib/prisma"

export type SystemSettings = {
  otpLoginEnabled: boolean
}

const SETTINGS_ID = "default"

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const row = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } })
    return { otpLoginEnabled: row?.otpLoginEnabled ?? false }
  } catch {
    return { otpLoginEnabled: false }
  }
}
