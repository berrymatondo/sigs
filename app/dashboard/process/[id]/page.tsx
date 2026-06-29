import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProcessBuilder, type ProcessDraft } from "@/components/dashboard/process-builder"
import { requireRole } from "@/lib/session"
import { getProcessDefinition } from "../actions"

export default async function EditProcessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(["MANAGER", "ADMIN"])
  const process = await getProcessDefinition(id)
  if (!process) notFound()

  const locked = process.openInstances > 0

  const initial: ProcessDraft = {
    id: process.id,
    nom: process.nom,
    description: process.description ?? "",
    dureeJours: process.dureeJours,
    cout: process.cout,
    actif: process.actif,
    steps: process.steps.map((s) => ({
      nom: s.nom,
      dureeJours: s.dureeJours,
      description: s.description ?? "",
      commentaire: s.commentaire ?? "",
      subSteps: s.subSteps.map((sub) => ({
        nom: sub.nom,
        documentsRequis: sub.documentsRequis,
      })),
    })),
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/process"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux process
      </Link>
      <PageHeader
        title={locked ? "Consulter le process" : "Modifier le process"}
        description={
          locked
            ? "Ce process a des dossiers en cours : le layout est en lecture seule."
            : "Modifiez les étapes, sous-étapes, la durée et le coût."
        }
      />

      {locked ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            {process.openInstances} dossier{process.openInstances > 1 ? "s" : ""} en cours utilise
            {process.openInstances > 1 ? "nt" : ""} ce process. Le layout ne peut pas être modifié
            tant que ces dossiers ne sont pas terminés.
          </p>
        </div>
      ) : null}

      <ProcessBuilder initial={initial} readOnly={locked} />
    </div>
  )
}
