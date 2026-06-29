"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { notifyDossierCloture } from "@/lib/email"
import { revalidatePath } from "next/cache"

const CLOSED_STATUTS = ["TERMINE", "ARCHIVE"]

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
 * Toggle a sub-step checkbox. Only allowed:
 *  - for staff,
 *  - on a dossier that is not closed,
 *  - on the dossier's CURRENT step (sequential editing),
 *  - while that step is not yet validated.
 */
export async function toggleSubStep(subStepStateId: string, coche: boolean) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const sub = await prisma.dossierSubStepState.findUnique({
    where: { id: subStepStateId },
    include: { stepState: { include: { dossier: true } } },
  })
  if (!sub) throw new Error("Sous-étape introuvable.")
  const { stepState } = sub
  const dossier = stepState.dossier

  if (CLOSED_STATUTS.includes(dossier.statut)) {
    throw new Error("Ce dossier est terminé : il n'est plus modifiable.")
  }
  if (stepState.valide) {
    throw new Error("Cette étape est déjà validée.")
  }
  // Sequential editing: only the current step (etapeActuelle, 0-based) can be edited.
  if (stepState.ordre - 1 !== dossier.etapeActuelle) {
    throw new Error("Vous ne pouvez modifier que l'étape en cours.")
  }

  await prisma.dossierSubStepState.update({
    where: { id: subStepStateId },
    data: {
      coche,
      cocheAt: coche ? new Date() : null,
      cocheBy: coche ? user.name ?? user.id : null,
    },
  })

  // First activity moves the dossier into "EN_COURS".
  if (coche && dossier.statut !== "EN_COURS") {
    await prisma.dossier.update({ where: { id: dossier.id }, data: { statut: "EN_COURS" as never } })
    await recordStatutChange(dossier.id, dossier.statut, "EN_COURS", user)
  }

  revalidatePath(`/dashboard/dossiers/${dossier.id}`)
}

/**
 * Validate the current step. Requires every sub-step checked. Advances the
 * dossier to the next step, or closes it (TERMINE) when it was the last step.
 */
export async function validateStep(stepStateId: string) {
  const user = await requireRole(["AGENT", "MANAGER", "ADMIN"])
  const stepState = await prisma.dossierStepState.findUnique({
    where: { id: stepStateId },
    include: { subStepStates: true, dossier: true },
  })
  if (!stepState) throw new Error("Étape introuvable.")
  const dossier = stepState.dossier

  if (CLOSED_STATUTS.includes(dossier.statut)) {
    throw new Error("Ce dossier est terminé.")
  }
  if (stepState.ordre - 1 !== dossier.etapeActuelle) {
    throw new Error("Vous ne pouvez valider que l'étape en cours.")
  }
  if (stepState.valide) {
    throw new Error("Cette étape est déjà validée.")
  }
  // Every sub-step must be checked. A step without sub-steps can be validated.
  const allChecked = stepState.subStepStates.every((s) => s.coche)
  if (!allChecked) {
    throw new Error("Toutes les sous-étapes doivent être cochées avant de valider.")
  }

  await prisma.dossierStepState.update({
    where: { id: stepStateId },
    data: { valide: true, valideAt: new Date(), valideBy: user.name ?? user.id },
  })

  // Is this the last step?
  const totalSteps = await prisma.dossierStepState.count({ where: { dossierId: dossier.id } })
  const isLast = stepState.ordre >= totalSteps

  if (isLast) {
    const updated = await prisma.dossier.update({
      where: { id: dossier.id },
      data: { etapeActuelle: stepState.ordre, statut: "TERMINE" as never },
      include: { client: true },
    })
    await recordStatutChange(dossier.id, dossier.statut, "TERMINE", user)
    try {
      await notifyDossierCloture(updated)
    } catch (e) {
      console.error("[v0] notifyDossierCloture error:", e)
    }
  } else {
    // Advance to the next step (etapeActuelle becomes this step's ordre, 0-based next index).
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: { etapeActuelle: stepState.ordre },
    })
  }

  revalidatePath(`/dashboard/dossiers/${dossier.id}`)
  revalidatePath("/dashboard/dossiers")
}
