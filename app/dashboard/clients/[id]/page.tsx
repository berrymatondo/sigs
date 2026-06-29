import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Plus, FileText, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatutBadge } from "@/components/dashboard/badges"
import { ClientFormDialog } from "@/components/dashboard/client-form-dialog"
import { DocumentDialog } from "@/components/dashboard/document-dialog"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { requireUser } from "@/lib/session"
import { dossierTypeLabels, formatClientName } from "@/lib/domain"
import { getClient, deleteClient } from "../actions"
import { deleteDocument } from "@/app/dashboard/documents/actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const client = await getClient(id)
  if (!client) notFound()

  const isAdmin = user.role === "ADMIN"

  return (
    <div>
      <Link
        href="/dashboard/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux clients
      </Link>

      <PageHeader
        title={formatClientName(client)}
        description={`${client._count.dossiers} dossier(s) · ${client._count.documents} document(s)`}
        action={
          <div className="flex gap-2">
            <ClientFormDialog
              client={{
                id: client.id,
                nom: client.nom,
                postnom: client.postnom ?? "",
                prenom: client.prenom ?? "",
                email: client.email,
                telephone: client.telephone ?? "",
                adresse: client.adresse ?? "",
                dateNaissance: client.dateNaissance
                  ? format(client.dateNaissance, "yyyy-MM-dd")
                  : "",
              }}
            />
            {isAdmin && (
              <DeleteButton
                action={deleteClient.bind(null, client.id)}
                redirectTo="/dashboard/clients"
                description="Supprimer ce client supprimera aussi ses dossiers liés."
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" /> {client.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" /> {client.telephone || "—"}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" /> {client.adresse || "—"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              {client.dateNaissance
                ? format(client.dateNaissance, "d MMMM yyyy", { locale: fr })
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dossiers</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/dossiers/nouveau?clientId=${client.id}`}>
                <Plus className="size-4" /> Nouveau dossier
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.dossiers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun dossier pour ce client.
              </p>
            ) : (
              client.dossiers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/dossiers/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.numero} · {dossierTypeLabels[d.type]}
                    </p>
                  </div>
                  <StatutBadge statut={d.statut} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents du client</CardTitle>
          <DocumentDialog clientId={client.id} />
        </CardHeader>
        <CardContent className="space-y-3">
          {client.documents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun document.</p>
          ) : (
            client.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.titre}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <a href={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      <span className="sr-only">Ouvrir</span>
                    </a>
                  </Button>
                  <DeleteButton action={deleteDocument.bind(null, doc.id)} label="" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {client.userId ? (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documents personnels du visiteur</CardTitle>
            <DocumentDialog userId={client.userId} />
          </CardHeader>
          <CardContent className="space-y-3">
            {(client.user?.personalDocuments ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun document personnel.
              </p>
            ) : (
              client.user!.personalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.titre}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <a href={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        <span className="sr-only">Ouvrir</span>
                      </a>
                    </Button>
                    <DeleteButton action={deleteDocument.bind(null, doc.id)} label="" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
