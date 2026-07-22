import { auth, type AppRole } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role: AppRole
  phone?: string | null
}

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session?.user) return null
  const u = session.user as unknown as SessionUser
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: (u.role as AppRole) ?? "VISITEUR",
    phone: u.phone,
  }
}

export function isStaff(role: AppRole) {
  return role === "AGENT" || role === "MANAGER" || role === "ADMIN"
}

/**
 * True while a staff sign-in is waiting on its emailed OTP confirmation
 * (see lib/otp.ts and the session.create hook in lib/auth.ts). Pages behind
 * requireUser/requireRole are inaccessible until this clears.
 */
export async function isPendingOtp(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  const otpVerified = (session.session as unknown as { otpVerified?: boolean }).otpVerified
  return isStaff((session.user as unknown as SessionUser).role) && otpVerified === false
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (await isPendingOtp()) redirect("/verify-otp")
  return user
}

export async function requireRole(roles: AppRole[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect("/")
  return user
}

export function isVisiteur(role: AppRole) {
  return role === "VISITEUR"
}
