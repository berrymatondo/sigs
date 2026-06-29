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

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return user
}

export async function requireRole(roles: AppRole[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect("/")
  return user
}

export function isStaff(role: AppRole) {
  return role === "AGENT" || role === "MANAGER" || role === "ADMIN"
}

export function isVisiteur(role: AppRole) {
  return role === "VISITEUR"
}
