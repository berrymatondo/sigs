"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSession, isStaff, type SessionUser } from "@/lib/session"
import { generateAndSendLoginOtp, verifyLoginOtp } from "@/lib/otp"

async function requirePendingSession() {
  const session = await getSession()
  if (!session?.user) throw new Error("Non connecté.")
  const user = session.user as unknown as SessionUser
  if (!isStaff(user.role)) throw new Error("Aucune vérification en attente.")
  return { sessionId: session.session.id, user }
}

export type SubmitOtpState = { ok: boolean; message: string } | null

export async function submitLoginOtp(_prev: SubmitOtpState, formData: FormData): Promise<SubmitOtpState> {
  const { sessionId } = await requirePendingSession()
  const code = String(formData.get("code") ?? "").trim()
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, message: "Le code doit contenir 6 chiffres." }
  }

  const result = await verifyLoginOtp(sessionId, code)
  switch (result) {
    case "success":
      return { ok: true, message: "Vérifié." }
    case "expired":
      return { ok: false, message: "Ce code a expiré. Demandez-en un nouveau." }
    case "too_many_attempts":
      return { ok: false, message: "Trop de tentatives. Demandez un nouveau code." }
    default:
      return { ok: false, message: "Code incorrect." }
  }
}

export async function resendLoginOtp(): Promise<{ ok: boolean }> {
  const { sessionId, user } = await requirePendingSession()
  const sent = await generateAndSendLoginOtp({
    sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
  })
  return { ok: sent }
}

export async function cancelLoginOtp(): Promise<void> {
  await auth.api.signOut({ headers: await headers() })
}
