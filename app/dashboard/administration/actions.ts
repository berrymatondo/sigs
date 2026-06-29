"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireRole } from "@/lib/session"
import { auth, type AppRole } from "@/lib/auth"
import { ROLES, roleLabels } from "@/lib/domain"
import { sendNewUserCredentials, sendAdminResetCredentials } from "@/lib/email"
import { revalidatePath } from "next/cache"

/** Generates a readable but strong temporary password. */
function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%"
  let out = ""
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export type UserInput = {
  name: string
  email: string
  phone?: string
  role: AppRole
  password?: string
}

export async function createUser(data: UserInput) {
  await requireRole(["ADMIN"])

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  if (!name || !email) throw new Error("Le nom et l'email sont obligatoires.")
  // The password is optional: if the admin leaves it blank, we generate a
  // secure temporary one. In all cases the credentials are emailed to the user.
  const password = data.password?.trim() || generatePassword()
  if (password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.")
  }
  if (!ROLES.includes(data.role)) throw new Error("Rôle invalide.")

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error("Un compte existe déjà avec cet email.")

  // Use Better Auth so the password is hashed with the same scheme as sign-up.
  // We do not forward any headers, so this never alters the admin's session.
  const result = await auth.api.signUpEmail({
    body: { name, email, password },
  })

  // Apply the chosen role and phone (sign-up always defaults role to VISITEUR).
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: data.role, phone: data.phone?.trim() || null },
  })

  // Email the login and password to the new user.
  const emailSent = await sendNewUserCredentials({
    name,
    email,
    password,
    roleLabel: roleLabels[data.role],
  })

  revalidatePath("/dashboard/administration")
  return { emailSent }
}

export async function updateUser(userId: string, data: UserInput) {
  const admin = await requireRole(["ADMIN"])

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  if (!name || !email) throw new Error("Le nom et l'email sont obligatoires.")
  if (!ROLES.includes(data.role)) throw new Error("Rôle invalide.")

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error("Utilisateur introuvable.")

  // An admin cannot change their own role here (mirrors updateUserRole).
  if (userId === admin.id && data.role !== target.role) {
    throw new Error("Vous ne pouvez pas modifier votre propre rôle.")
  }
  // Prevent removing the last administrator.
  if (target.role === "ADMIN" && data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      throw new Error("Impossible de rétrograder le dernier administrateur.")
    }
  }

  // Ensure the new email is not used by someone else.
  if (email !== target.email) {
    const clash = await prisma.user.findUnique({ where: { email } })
    if (clash) throw new Error("Un autre compte utilise déjà cet email.")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone: data.phone?.trim() || null, role: data.role },
  })
  revalidatePath("/dashboard/administration")
}

export async function getUsers(query?: string) {
  await requireRole(["ADMIN"])
  return prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      banned: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { dossiersAgent: true, taches: true } },
    },
  })
}

export async function getUserStats() {
  await requireRole(["ADMIN"])
  const [total, admins, managers, agents, visiteurs, banned] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "MANAGER" } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "VISITEUR" } }),
    prisma.user.count({ where: { banned: true } }),
  ])
  return { total, admins, managers, agents, visiteurs, banned }
}

export async function updateUserRole(userId: string, role: AppRole) {
  const admin = await requireRole(["ADMIN"])

  if (!ROLES.includes(role)) {
    throw new Error("Rôle invalide.")
  }
  if (userId === admin.id) {
    throw new Error("Vous ne pouvez pas modifier votre propre rôle.")
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error("Utilisateur introuvable.")

  // Prevent removing the last administrator
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      throw new Error("Impossible de rétrograder le dernier administrateur.")
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath("/dashboard/administration")
}

export async function toggleUserBan(userId: string) {
  const admin = await requireRole(["ADMIN"])

  if (userId === admin.id) {
    throw new Error("Vous ne pouvez pas suspendre votre propre compte.")
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error("Utilisateur introuvable.")

  await prisma.user.update({
    where: { id: userId },
    data: { banned: !target.banned },
  })
  revalidatePath("/dashboard/administration")
  return !target.banned
}

/**
 * Lets an administrator reset another user's password. If `newPassword` is
 * omitted, a secure temporary password is generated. The new password is hashed
 * with Better Auth's scheme and emailed to the user. Also revokes the target's
 * active sessions so the old password can no longer be used.
 */
export async function resetUserPassword(userId: string, newPassword?: string) {
  await requireRole(["ADMIN"])

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error("Utilisateur introuvable.")

  const password = newPassword?.trim() || generatePassword()
  if (password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.")
  }

  // Hash with Better Auth's configured hasher and update the credential account.
  const ctx = await auth.$context
  const hashed = await ctx.password.hash(password)
  await ctx.internalAdapter.updatePassword(userId, hashed)

  // Invalidate the user's existing sessions so the old password is unusable.
  await prisma.session.deleteMany({ where: { userId } })

  // Email the new password to the user.
  const emailSent = await sendAdminResetCredentials({
    name: target.name,
    email: target.email,
    password,
  })

  revalidatePath("/dashboard/administration")
  return { emailSent }
}

export async function deleteUser(userId: string) {
  const admin = await requireRole(["ADMIN"])

  if (userId === admin.id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.")
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error("Utilisateur introuvable.")

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      throw new Error("Impossible de supprimer le dernier administrateur.")
    }
  }

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/dashboard/administration")
}

// Re-exported for components that only need the current user id
export async function getAdminContext() {
  const user = await getCurrentUser()
  return { currentUserId: user?.id ?? null }
}
