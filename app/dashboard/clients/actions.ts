"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getClients(query?: string) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  return prisma.client.findMany({
    where: query
      ? {
          OR: [
            { nom: { contains: query, mode: "insensitive" } },
            { postnom: { contains: query, mode: "insensitive" } },
            { prenom: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { telephone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { dossiers: true } } },
  })
}

export async function getClient(id: string) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  return prisma.client.findUnique({
    where: { id },
    include: {
      dossiers: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      // Personal documents the linked user uploaded from their own profile.
      user: {
        include: {
          personalDocuments: { orderBy: { createdAt: "desc" } },
        },
      },
      _count: { select: { dossiers: true, documents: true } },
    },
  })
}

export type ClientInput = {
  nom: string
  postnom?: string
  prenom?: string
  email: string
  telephone?: string
  adresse?: string
  dateNaissance?: string
}

export async function createClient(data: ClientInput) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const client = await prisma.client.create({
    data: {
      nom: data.nom,
      postnom: data.postnom || null,
      prenom: data.prenom || null,
      email: data.email,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
    },
  })
  revalidatePath("/dashboard/clients")
  return client
}

export async function updateClient(id: string, data: ClientInput) {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const client = await prisma.client.update({
    where: { id },
    data: {
      nom: data.nom,
      postnom: data.postnom || null,
      prenom: data.prenom || null,
      email: data.email,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
    },
  })
  revalidatePath("/dashboard/clients")
  revalidatePath(`/dashboard/clients/${id}`)
  return client
}

export async function deleteClient(id: string) {
  await requireRole(["ADMIN"])
  await prisma.client.delete({ where: { id } })
  revalidatePath("/dashboard/clients")
}
