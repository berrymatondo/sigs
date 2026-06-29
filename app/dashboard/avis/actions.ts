"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { revalidatePath } from "next/cache"

// List every review for the admin moderation page (newest first).
export async function getAvisAdmin() {
  await requireRole(["ADMIN"])
  return prisma.avis.findMany({ orderBy: { createdAt: "desc" } })
}

// Only administrators can remove a review.
export async function deleteAvis(id: string) {
  await requireRole(["ADMIN"])
  await prisma.avis.delete({ where: { id } })
  revalidatePath("/dashboard/avis")
  revalidatePath("/")
}
