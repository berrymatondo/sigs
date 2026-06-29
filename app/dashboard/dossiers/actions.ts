"use server"

import { prisma } from "@/lib/prisma"
import { requireRole, requireUser, isStaff } from "@/lib/session"
import { generateDossierNumero, generateQrDataUrl } from "@/lib/domain"
import { notifyDossierCreated, notifyDossierCloture } from "@/lib/email"
import { revalidatePath } from "next/cache"

/**
 * Record a status change in the dossier history.
 * `tx` accepts a Prisma client or transaction client.
 */
async function recordStatutChange(
  dossierId: string,
  ancienStatut: string | null,
  nouveauStatut: string,
  user: { id: string; name?: string | null },
) {
  await prisma.dossierStatutHistory.create({
    data: {
      dossierId,
      ancienStatut: (ancienStatut as never) ?? null,
      nouveauStatut: nouveauStatut as never,
      userId: user.id,
      userName: user.name ?? null,
    },
  })
}

/**
 * Keep the dossier's auto-generated task in sync with its assignment:
 *  - assigning to an agent creates a task (assigned to that agent) with a
 *    dateAssignation, so the work shows up in the task list.
 *  - unassigning (or reassigning to someone else) closes the previous agent's
 *    open auto-task (statut TERMINEE).
 * Manually created tasks are never touched (only `auto` tasks).
 */
async function syncAssignmentTask(
  dossier: { id: string; numero: string; nom: string },
  previousAgentId: string | null,
  newAgentId: string | null,
) {
  const prev = previousAgentId ?? null
  const next = newAgentId ?? null
  if (prev === next) return

  // Close the open auto-task of the previous agent on unassign/reassign.
  if (prev) {
    await prisma.tache.updateMany({
      where: {
        dossierId: dossier.id,
        auto: true,
        agentId: prev,
        statut: { in: ["A_FAIRE", "EN_COURS"] as never },
      },
      data: { statut: "TERMINEE" as never },
    })
  }

  // Create the associated task for the newly assigned agent.
  if (next) {
    await prisma.tache.create({
      data: {
        titre: `Traiter le dossier ${dossier.numero} — ${dossier.nom}`,
        description: "Tâche créée automatiquement lors de l'assignation du dossier.",
        priorite: "NORMALE" as never,
        statut: "A_FAIRE" as never,
        dossierId: dossier.id,
        agentId: next,
        auto: true,
        dateAssignation: new Date(),
      },
    })
  }
}

export async function getDossiers(query?: string, statut?: string) {
  const user = await requireUser()
  const isClient = user.role === "VISITEUR"

  return prisma.dossier.findMany({
    where: {
      AND: [
        isClient ? { client: { userId: user.id } } : {},
        statut ? { statut: statut as never } : {},
        query
          ? {
              OR: [
                { nom: { contains: query, mode: "insensitive" } },
                { numero: { contains: query, mode: "insensitive" } },
                { client: { nom: { contains: query, mode: "insensitive" } } },
                { client: { postnom: { contains: query, mode: "insensitive" } } },
                { client: { prenom: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      agent: { select: { name: true } },
      _count: { select: { documents: true, taches: true } },
      processDefinition: { select: { nom: true } },
      stepStates: {
        orderBy: { ordre: "asc" },
        select: { ordre: true, nom: true, valide: true },
      },
    },
  })
}

export async function getDossier(id: string) {
  const user = await requireUser()
  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          // Documents attached to the client record.
          documents: { orderBy: { createdAt: "desc" } },
          // Personal documents the linked user uploaded from their own profile.
          user: {
            include: {
              personalDocuments: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      },
      agent: { select: { id: true, name: true } },
      documents: { orderBy: { createdAt: "desc" } },
      taches: { orderBy: { createdAt: "desc" }, include: { agent: { select: { name: true } } } },
      statutHistory: { orderBy: { createdAt: "desc" } },
      processDefinition: { select: { id: true, nom: true, dureeJours: true, cout: true } },
      stepStates: {
        orderBy: { ordre: "asc" },
        include: {
          subStepStates: {
            orderBy: { ordre: "asc" },
            include: { documents: { orderBy: { createdAt: "desc" } } },
          },
        },
      },
    },
  })
  if (!dossier) return null
  // A client may only see their own dossier
  if (user.role === "VISITEUR" && dossier.client.userId !== user.id) return null
  return dossier
}

/**
 * Snapshot a process definition (layout) into a dossier as step/sub-step
 * instances. Kept readable even if the layout is later edited. Returns the
 * loaded definition, or null if the id is invalid.
 */
async function instantiateProcess(dossierId: string, processDefinitionId: string) {
  const processDefinition = await prisma.processDefinition.findUnique({
    where: { id: processDefinitionId },
    include: {
      steps: {
        orderBy: { ordre: "asc" },
        include: { subSteps: { orderBy: { ordre: "asc" } } },
      },
    },
  })
  if (!processDefinition) return null
  for (const step of processDefinition.steps) {
    await prisma.dossierStepState.create({
      data: {
        dossierId,
        stepId: step.id,
        ordre: step.ordre,
        nom: step.nom,
        dureeJours: step.dureeJours,
        description: step.description,
        commentaire: step.commentaire,
        subStepStates: {
          create: step.subSteps.map((sub) => ({
            dossierId,
            subStepId: sub.id,
            ordre: sub.ordre,
            nom: sub.nom,
            documentsRequis: sub.documentsRequis,
          })),
        },
      },
    })
  }
  return processDefinition
}

export type DossierInput = {
  nom: string
  type: string
  clientId: string
  statut?: string
  montant?: number
  notes?: string
  agentId?: string | null
  processDefinitionId?: string | null
}

export async function createDossier(data: DossierInput) {
  // Any authenticated user can create a dossier.
  const user = await requireUser()
  const staff = isStaff(user.role)

  // Staff choose the client explicitly. A visitor's dossier is always attached
  // to their own client record, which we resolve (and create on the fly if it
  // does not exist yet) so they never need to pick a client.
  let clientId = data.clientId
  if (!staff) {
    let ownClient = await prisma.client.findUnique({ where: { userId: user.id } })
    if (!ownClient) {
      const [prenom, ...rest] = (user.name || "").trim().split(" ")
      ownClient = await prisma.client.create({
        data: {
          nom: rest.join(" ") || user.name || "Client",
          prenom: prenom || null,
          email: user.email,
          userId: user.id,
        },
      })
    }
    clientId = ownClient.id
  }
  if (!clientId) throw new Error("Client requis")

  const numero = generateDossierNumero()
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "")
  // Confirm the chosen process exists before linking it (visitors send none).
  const processDefinitionId = data.processDefinitionId
    ? (
        await prisma.processDefinition.findUnique({
          where: { id: data.processDefinitionId },
          select: { id: true },
        })
      )?.id ?? null
    : null

  const dossier = await prisma.dossier.create({
    data: {
      numero,
      nom: data.nom,
      type: data.type as never,
      statut: (data.statut as never) ?? "EN_ATTENTE",
      montant: data.montant ?? 0,
      notes: data.notes || null,
      clientId,
      // Visitors' dossiers start unassigned; staff become the handling agent.
      agentId: staff ? user.id : null,
      processDefinitionId,
      etapeActuelle: 0,
    },
    include: { client: true },
  })

  // Build the process instance (steps + sub-steps) when a process is linked.
  if (processDefinitionId) {
    await instantiateProcess(dossier.id, processDefinitionId)
  }
  // Generate a QR code that points to the secure dossier resolver.
  // Scanning it requires authentication before accessing the dossier.
  const qrPayload = `${baseUrl}/dossier/${dossier.numero}`
  const qrCode = await generateQrDataUrl(qrPayload)
  await prisma.dossier.update({ where: { id: dossier.id }, data: { qrCode } })

  // Record the initial status in the history
  await recordStatutChange(dossier.id, null, dossier.statut, user)

  // When staff create a dossier they become its agent: generate the task.
  await syncAssignmentTask(dossier, null, dossier.agentId)

  // Notify administrators of the new dossier
  await notifyDossierCreated(dossier)

  revalidatePath("/dashboard/dossiers")
  return dossier
}

export async function updateDossier(id: string, data: Partial<DossierInput>) {
  const user = await requireRole(["MANAGER", "ADMIN"])
  const current = await prisma.dossier.findUnique({
    where: { id },
    select: { statut: true, processDefinitionId: true, agentId: true },
  })

  // A process can be attached during the "prise de dossier" only if the dossier
  // does not already have one (instances are immutable once created).
  let attachProcessId: string | null = null
  if (data.processDefinitionId && !current?.processDefinitionId) {
    const def = await prisma.processDefinition.findUnique({
      where: { id: data.processDefinitionId },
      select: { id: true },
    })
    attachProcessId = def?.id ?? null
  }

  const dossier = await prisma.dossier.update({
    where: { id },
    data: {
      ...(data.nom !== undefined ? { nom: data.nom } : {}),
      ...(data.type !== undefined ? { type: data.type as never } : {}),
      ...(data.statut !== undefined ? { statut: data.statut as never } : {}),
      ...(data.montant !== undefined ? { montant: data.montant } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
      ...(data.agentId !== undefined ? { agentId: data.agentId || null } : {}),
      ...(attachProcessId ? { processDefinitionId: attachProcessId, etapeActuelle: 0 } : {}),
    },
  })
  // Build the process instance when a process is attached for the first time.
  if (attachProcessId) {
    await instantiateProcess(id, attachProcessId)
  }
  // Log status change made through the edit dialog
  if (data.statut !== undefined && current && current.statut !== (data.statut as never)) {
    await recordStatutChange(id, current.statut, data.statut, user)
  }
  // Sync the auto-task when the assignment changed through the edit dialog.
  if (data.agentId !== undefined) {
    await syncAssignmentTask(dossier, current?.agentId ?? null, dossier.agentId)
    revalidatePath("/dashboard/taches")
  }
  revalidatePath("/dashboard/dossiers")
  revalidatePath(`/dashboard/dossiers/${id}`)
  return dossier
}

/**
 * Reassign a dossier to a different agent.
 * Restricted to managers and administrators.
 */
export async function assignDossier(id: string, agentId: string | null) {
  await requireRole(["MANAGER", "ADMIN"])
  const current = await prisma.dossier.findUnique({ where: { id }, select: { agentId: true } })
  const dossier = await prisma.dossier.update({
    where: { id },
    data: { agentId: agentId || null },
  })
  // Create/close the associated task to reflect the new assignment.
  await syncAssignmentTask(dossier, current?.agentId ?? null, dossier.agentId)
  revalidatePath("/dashboard/dossiers")
  revalidatePath(`/dashboard/dossiers/${id}`)
  revalidatePath("/dashboard/taches")
}

export async function updateDossierStatut(id: string, statut: string) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const current = await prisma.dossier.findUnique({ where: { id }, select: { statut: true } })
  if (!current) throw new Error("Dossier introuvable")
  if (current.statut !== (statut as never)) {
    const dossier = await prisma.dossier.update({
      where: { id },
      data: { statut: statut as never },
      include: { client: true },
    })
    await recordStatutChange(id, current.statut, statut, user)
    // Notify administrators when a dossier is closed
    if (statut === "TERMINE") await notifyDossierCloture(dossier)
  }
  revalidatePath(`/dashboard/dossiers/${id}`)
  revalidatePath("/dashboard/dossiers")
}

/**
 * Close a dossier by setting its status to TERMINE.
 * Records the change in the status history.
 */
export async function clotureDossier(id: string) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const current = await prisma.dossier.findUnique({ where: { id }, select: { statut: true } })
  if (!current) throw new Error("Dossier introuvable")
  if (current.statut !== ("TERMINE" as never)) {
    const dossier = await prisma.dossier.update({
      where: { id },
      data: { statut: "TERMINE" as never },
      include: { client: true },
    })
    await recordStatutChange(id, current.statut, "TERMINE", user)
    // Notify administrators of the closure
    await notifyDossierCloture(dossier)
  }
  revalidatePath(`/dashboard/dossiers/${id}`)
  revalidatePath("/dashboard/dossiers")
}

export async function deleteDossier(id: string) {
  await requireRole(["ADMIN"])
  // A dossier can only be deleted when it has no attached documents and no tasks.
  const [documents, taches] = await Promise.all([
    prisma.document.count({ where: { dossierId: id } }),
    prisma.tache.count({ where: { dossierId: id } }),
  ])
  if (documents > 0 || taches > 0) {
    const raisons: string[] = []
    if (documents > 0) raisons.push(`${documents} document(s)`)
    if (taches > 0) raisons.push(`${taches} tâche(s)`)
    throw new Error(
      `Suppression impossible : ce dossier est lié à ${raisons.join(" et ")}. Supprimez-les d'abord.`,
    )
  }
  await prisma.dossier.delete({ where: { id } })
  revalidatePath("/dashboard/dossiers")
}

export async function getClientsForSelect() {
  await requireRole(["AGENT", "MANAGER", "ADMIN"])
  return prisma.client.findMany({
    where: { archived: false },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, postnom: true, prenom: true },
  })
}

/**
 * Staff members that a dossier can be assigned to.
 * Restricted to managers and administrators.
 */
export async function getAgentsForSelect() {
  await requireRole(["MANAGER", "ADMIN"])
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "MANAGER", "ADMIN"] }, banned: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  })
}
