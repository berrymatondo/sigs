"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendSelfServiceResetCredentials } from "@/lib/email"

/** Generates a readable but strong temporary password. */
function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%"
  let out = ""
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

/**
 * Public self-service password reset. When a user submits their email, a new
 * password is generated, hashed with Better Auth's scheme, stored, and emailed
 * to the user; their active sessions are revoked so the old password no longer
 * works. Always returns the same result regardless of whether the account
 * exists, to avoid leaking which email addresses are registered.
 */
export async function resetPasswordByEmail(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase()
  if (!email) throw new Error("L'adresse email est obligatoire.")

  const user = await prisma.user.findUnique({ where: { email } })
  // Silently succeed when no account matches (anti-enumeration).
  if (!user) return { ok: true }

  const password = generatePassword()
  const ctx = await auth.$context
  const hashed = await ctx.password.hash(password)
  await ctx.internalAdapter.updatePassword(user.id, hashed)

  // Invalidate existing sessions so the old password cannot be reused.
  await prisma.session.deleteMany({ where: { userId: user.id } })

  await sendSelfServiceResetCredentials({
    name: user.name,
    email: user.email,
    password,
  })

  return { ok: true }
}
