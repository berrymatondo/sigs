"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { revalidatePath } from "next/cache"

// Statuses considered "open" (not finished). A layout cannot be edited while
// at least one dossier instance is in one of these statuses.
const OPEN_STATUTS = [
  "BROUILLON",
  "EN_ATTENTE",
  "DOCUMENTS_MANQUANTS",
  "EN_COURS",
  "VALIDE",
  "REFUSE",
] as const

export type SubStepInput = {
  nom: string
  documentsRequis: string[]
}

export type StepInput = {
  nom: string
  dureeJours: number
  description?: string
  commentaire?: string
  subSteps: SubStepInput[]
}

export type ProcessInput = {
  nom: string
  description?: string
  dureeJours: number
  cout: number
  actif: boolean
  steps: StepInput[]
}

export async function getProcessDefinitions() {
  await requireRole(["MANAGER", "ADMIN"])
  const processes = await prisma.processDefinition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { steps: true, dossiers: true } },
    },
  })
  // Compute, for each process, whether it has open (non-finished) instances.
  const openCounts = await Promise.all(
    processes.map((p) =>
      prisma.dossier.count({
        where: { processDefinitionId: p.id, statut: { in: OPEN_STATUTS as never } },
      }),
    ),
  )
  return processes.map((p, i) => ({ ...p, openInstances: openCounts[i] }))
}

export async function getProcessDefinition(id: string) {
  await requireRole(["MANAGER", "ADMIN"])
  const process = await prisma.processDefinition.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { ordre: "asc" },
        include: { subSteps: { orderBy: { ordre: "asc" } } },
      },
    },
  })
  if (!process) return null
  const openInstances = await prisma.dossier.count({
    where: { processDefinitionId: id, statut: { in: OPEN_STATUTS as never } },
  })
  return { ...process, openInstances }
}

/** Whether a process layout can currently be edited (no open instances). */
export async function canEditProcess(id: string) {
  const openInstances = await prisma.dossier.count({
    where: { processDefinitionId: id, statut: { in: OPEN_STATUTS as never } },
  })
  return openInstances === 0
}

function validateInput(data: ProcessInput) {
  if (!data.nom?.trim()) throw new Error("Le nom du process est obligatoire.")
  if (!data.steps || data.steps.length === 0) {
    throw new Error("Un process doit comporter au moins une étape.")
  }
  for (const step of data.steps) {
    if (!step.nom?.trim()) throw new Error("Chaque étape doit avoir un nom.")
  }
}

export async function createProcessDefinition(data: ProcessInput) {
  await requireRole(["MANAGER", "ADMIN"])
  validateInput(data)

  const process = await prisma.processDefinition.create({
    data: {
      nom: data.nom.trim(),
      description: data.description?.trim() || null,
      dureeJours: data.dureeJours ?? 0,
      cout: data.cout ?? 0,
      actif: data.actif ?? true,
      steps: {
        create: data.steps.map((step, i) => ({
          ordre: i + 1,
          nom: step.nom.trim(),
          dureeJours: step.dureeJours ?? 0,
          description: step.description?.trim() || null,
          commentaire: step.commentaire?.trim() || null,
          subSteps: {
            create: (step.subSteps || []).map((sub, j) => ({
              ordre: j + 1,
              nom: sub.nom.trim(),
              documentsRequis: (sub.documentsRequis || []).filter((d) => d.trim()),
            })),
          },
        })),
      },
    },
  })
  revalidatePath("/dashboard/process")
  return process
}

export async function updateProcessDefinition(id: string, data: ProcessInput) {
  await requireRole(["MANAGER", "ADMIN"])
  validateInput(data)

  // Guard: refuse to edit the layout while open instances exist.
  const editable = await canEditProcess(id)
  if (!editable) {
    throw new Error(
      "Ce process possède des dossiers en cours. Le layout ne peut pas être modifié tant que ces dossiers ne sont pas terminés.",
    )
  }

  await prisma.$transaction(async (tx) => {
    // Replace the whole step tree. Existing (only-finished) instances keep a
    // readable snapshot because their state rows store the labels and their
    // references are set to null on delete.
    await tx.processStep.deleteMany({ where: { processId: id } })
    await tx.processDefinition.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        dureeJours: data.dureeJours ?? 0,
        cout: data.cout ?? 0,
        actif: data.actif ?? true,
        steps: {
          create: data.steps.map((step, i) => ({
            ordre: i + 1,
            nom: step.nom.trim(),
            dureeJours: step.dureeJours ?? 0,
            description: step.description?.trim() || null,
            commentaire: step.commentaire?.trim() || null,
            subSteps: {
              create: (step.subSteps || []).map((sub, j) => ({
                ordre: j + 1,
                nom: sub.nom.trim(),
                documentsRequis: (sub.documentsRequis || []).filter((d) => d.trim()),
              })),
            },
          })),
        },
      },
    })
  })

  revalidatePath("/dashboard/process")
  revalidatePath(`/dashboard/process/${id}`)
}

export async function deleteProcessDefinition(id: string) {
  await requireRole(["ADMIN"])
  const dossierCount = await prisma.dossier.count({ where: { processDefinitionId: id } })
  if (dossierCount > 0) {
    throw new Error(
      "Ce process est utilisé par des dossiers et ne peut pas être supprimé. Désactivez-le à la place.",
    )
  }
  await prisma.processDefinition.delete({ where: { id } })
  revalidatePath("/dashboard/process")
}

export async function toggleProcessActif(id: string, actif: boolean) {
  await requireRole(["MANAGER", "ADMIN"])
  await prisma.processDefinition.update({ where: { id }, data: { actif } })
  revalidatePath("/dashboard/process")
  revalidatePath(`/dashboard/process/${id}`)
}

/**
 * A process definition plus, for each step, how many dossiers are currently
 * actively working on it, and how many dossiers have completed the whole
 * process — the live counts shown on the process schema diagram.
 */
export async function getProcessSchema(id: string) {
  await requireRole(["MANAGER", "ADMIN"])
  const process = await prisma.processDefinition.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { ordre: "asc" },
        include: { subSteps: { orderBy: { ordre: "asc" } } },
      },
    },
  })
  if (!process) return null

  const dossiers = await prisma.dossier.findMany({
    where: { processDefinitionId: id },
    select: { etapeActuelle: true, statut: true },
  })

  const stepCounts = new Map<number, number>()
  let termineCount = 0
  for (const d of dossiers) {
    if (d.statut === "TERMINE" || d.statut === "ARCHIVE") {
      termineCount += 1
      continue
    }
    stepCounts.set(d.etapeActuelle, (stepCounts.get(d.etapeActuelle) ?? 0) + 1)
  }

  return {
    ...process,
    steps: process.steps.map((step) => ({
      ...step,
      // A dossier "at" this step has etapeActuelle === ordre - 1 (0-based).
      dossiersEnCours: stepCounts.get(step.ordre - 1) ?? 0,
    })),
    dossiersTermines: termineCount,
    dossiersTotal: dossiers.length,
  }
}

/** Active processes offered when creating a dossier. */
export async function getActiveProcessesForSelect() {
  return prisma.processDefinition.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, dureeJours: true, cout: true },
  })
}
