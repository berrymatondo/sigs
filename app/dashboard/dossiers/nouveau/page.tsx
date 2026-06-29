import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { DossierForm } from "@/components/dashboard/dossier-form"
import { requireUser, isStaff } from "@/lib/session"
import { getClientsForSelect } from "../actions"
import { getActiveProcessesForSelect } from "../../process/actions"

export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const user = await requireUser()
  const staff = isStaff(user.role)
  const { clientId } = await searchParams
  // Visitors don't pick a client: their dossier is attached to their own
  // account automatically, so we only load the client list for staff.
  const clients = staff ? await getClientsForSelect() : []
  // Visitors don't choose a process; it is assigned later by an agent.
  const processes = staff ? await getActiveProcessesForSelect() : []

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/dossiers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux dossiers
      </Link>
      <PageHeader title="Nouveau dossier" description="Créez un dossier et générez automatiquement son QR code de suivi." />
      <DossierForm
        clients={clients}
        processes={processes}
        defaultClientId={clientId}
        isStaff={staff}
      />
    </div>
  )
}
