"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getMyDossiers() {
  const user = await requireUser()
  return prisma.dossier.findMany({
    where: { client: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  })
}

export async function getMyProfile() {
  const user = await requireUser()
  const client = await prisma.client.findUnique({ where: { userId: user.id } })
  return { user, client }
}

// Personal documents attached directly to the current user's profile.
export async function getMyProfileDocuments() {
  const user = await requireUser()
  return prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateMyProfile(data: { name: string; phone?: string }) {
  const user = await requireUser()
  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, phone: data.phone || null },
  })
  // Keep a linked client record in sync if it exists
  await prisma.client.updateMany({
    where: { userId: user.id },
    data: { telephone: data.phone || null },
  })
  revalidatePath("/dashboard/profil")
}
