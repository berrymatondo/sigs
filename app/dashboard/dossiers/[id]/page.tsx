import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, ExternalLink, Calendar, User2, Banknote, Download, QrCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatutBadge, PrioriteBadge } from "@/components/dashboard/badges"
import { StatutChanger } from "@/components/dashboard/statut-changer"
import { StatutHistory } from "@/components/dashboard/statut-history"
import { DocumentDialog } from "@/components/dashboard/document-dialog"
import { TacheDialog } from "@/components/dashboard/tache-dialog"
import { TacheStatutSelect } from "@/components/dashboard/tache-statut-select"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { DownloadButton } from "@/components/dashboard/download-button"
import { DossierEditDialog } from "@/components/dashboard/dossier-edit-dialog"
import { requireUser, isStaff } from "@/lib/session"
import { dossierTypeLabels, tacheStatutLabels, formatUsd, formatClientName } from "@/lib/domain"
import { DossierProcessInstance } from "@/components/dashboard/dossier-process-instance"
import { getDossier, deleteDossier, getAgentsForSelect } from "../actions"
import { getActiveProcessesForSelect } from "../../process/actions"
import { deleteDocument } from "../../documents/actions"
import { deleteTache } from "../../taches/actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams
  const user = await requireUser()
  const dossier = await getDossier(id)
  if (!dossier) notFound()

  const staff = isStaff(user.role)
  const isAdmin = user.role === "ADMIN"

  // Documents shown (read + download) in the "Informations" block.
  // Visitors only see their own personal documents; staff also see the
  // documents attached to the client record.
  const personalDocuments = dossier.client.user?.personalDocuments ?? []
  const linkedDocuments = staff
    ? [...dossier.client.documents, ...personalDocuments]
    : personalDocuments
  const canManage = user.role === "ADMIN" || user.role === "MANAGER"
  const agents = canManage ? await getAgentsForSelect() : []
  // Active processes are offered in the edit dialog so an agent can attach one
  // when taking on a dossier that was created without a process (e.g. by a visitor).
  const processes = canManage && !dossier.processDefinition ? await getActiveProcessesForSelect() : []

  return (
    <div>
      <Link
        href="/dashboard/dossiers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux dossiers
      </Link>

      <PageHeader
        title={dossier.nom}
        description={`${dossier.numero} · ${dossierTypeLabels[dossier.type]}`}
        action={
          <div className="flex items-center gap-2">
            <DownloadButton
              url={`/dashboard/dossiers/${dossier.id}/pdf`}
              filename={`${dossier.numero}.pdf`}
            >
              <Download className="size-4" /> Télécharger le PDF
            </DownloadButton>
            <DownloadButton
              url={`/dashboard/dossiers/${dossier.id}/qr-pdf`}
              filename={`${dossier.numero}-qr.pdf`}
            >
              <QrCode className="size-4" /> PDF du code QR
            </DownloadButton>
            {canManage ? (
              <DossierEditDialog
                dossier={{
                  id: dossier.id,
                  nom: dossier.nom,
                  type: dossier.type,
                  montant: dossier.montant,
                  notes: dossier.notes,
                  agentId: dossier.agentId,
                  processDefinitionId: dossier.processDefinition?.id ?? null,
                  processName: dossier.processDefinition?.nom ?? null,
                }}
                agents={agents}
                processes={processes}
                defaultOpen={edit === "1"}
              />
            ) : null}
            {isAdmin ? (
              <DeleteButton
                action={deleteDossier.bind(null, dossier.id)}
                redirectTo="/dashboard/dossiers"
                label="Supprimer le dossier"
              />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info + status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <User2 className="size-4 text-muted-foreground" />
                <Link href={`/dashboard/clients/${dossier.clientId}`} className="hover:underline">
                  {formatClientName(dossier.client)}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="size-4 text-muted-foreground" />
                {formatUsd(dossier.montant)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                Créé le {format(dossier.createdAt, "d MMM yyyy", { locale: fr })}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User2 className="size-4 text-muted-foreground" />
                Agent : {dossier.agent?.name ?? "—"}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Statut du dossier</p>
              {staff ? (
                <StatutChanger id={dossier.id} statut={dossier.statut} />
              ) : (
                <StatutBadge statut={dossier.statut} />
              )}
            </div>

            {dossier.notes ? (
              <div className="space-y-1 border-t pt-4">
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{dossier.notes}</p>
              </div>
            ) : null}

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">
                {staff ? "Documents du client" : "Mes documents"}
              </p>
              {linkedDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun document.</p>
              ) : (
                <ul className="space-y-2">
                  {linkedDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{doc.titre}</span>
                      </div>
                      <Button asChild variant="ghost" size="icon">
                        <a
                          href={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="size-4" />
                          <span className="sr-only">Télécharger {doc.titre}</span>
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Code de suivi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {dossier.qrCode ? (
              <Image
                src={dossier.qrCode || "/placeholder.svg"}
                alt={`QR code du dossier ${dossier.numero}`}
                width={180}
                height={180}
                className="rounded-lg border"
                unoptimized
              />
            ) : (
              <p className="text-sm text-muted-foreground">QR non disponible.</p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Scannez ce code pour accéder au suivi public du dossier.
            </p>
          </CardContent>
        </Card>

        {/* Status change history */}
        <div className="lg:col-span-3">
          <StatutHistory entries={dossier.statutHistory} />
        </div>
      </div>

      {/* Process + Documents + tasks tabs */}
      <Tabs defaultValue={dossier.processDefinition ? "process" : "documents"} className="mt-6">
        <TabsList>
          {dossier.processDefinition ? (
            <TabsTrigger value="process">Suivi du process</TabsTrigger>
          ) : null}
          <TabsTrigger value="documents">Documents ({dossier.documents.length})</TabsTrigger>
          {staff ? <TabsTrigger value="taches">Tâches ({dossier.taches.length})</TabsTrigger> : null}
        </TabsList>

        {dossier.processDefinition ? (
          <TabsContent value="process">
            <DossierProcessInstance
              dossierId={dossier.id}
              processName={dossier.processDefinition.nom}
              etapeActuelle={dossier.etapeActuelle}
              canEdit={staff && dossier.statut !== "TERMINE"}
              isClosed={dossier.statut === "TERMINE"}
              canDownload
              steps={dossier.stepStates.map((s) => ({
                id: s.id,
                ordre: s.ordre,
                nom: s.nom,
                dureeJours: s.dureeJours,
                description: s.description,
                commentaire: s.commentaire,
                valide: s.valide,
                subStepStates: s.subStepStates.map((sub) => ({
                  id: sub.id,
                  ordre: sub.ordre,
                  nom: sub.nom,
                  documentsRequis: sub.documentsRequis,
                  coche: sub.coche,
                  documents: sub.documents.map((d) => ({
                    id: d.id,
                    titre: d.titre,
                    type: d.type,
                    fichier: d.fichier,
                  })),
                })),
              }))}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Documents du dossier</CardTitle>
              {/* Staff upload anywhere; visitors upload to their own dossier. */}
              <DocumentDialog dossierId={dossier.id} clientId={staff ? dossier.clientId : null} />
            </CardHeader>
            <CardContent className="space-y-3">
              {dossier.documents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun document.</p>
              ) : (
                dossier.documents.map((doc) => {
                  // Visitors may delete only their own uploads; staff delete any.
                  const canDelete = staff || doc.uploadedById === user.id
                  return (
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
                        {canDelete ? (
                          <DeleteButton action={deleteDocument.bind(null, doc.id)} label="" />
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {staff ? (
          <TabsContent value="taches">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Tâches</CardTitle>
                {canManage ? <TacheDialog dossierId={dossier.id} /> : null}
              </CardHeader>
              <CardContent className="space-y-3">
                {dossier.taches.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche.</p>
                ) : (
                  dossier.taches.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{t.titre}</p>
                          <PrioriteBadge priorite={t.priorite} />
                        </div>
                        {t.description ? (
                          <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <TacheStatutSelect id={t.id} statut={t.statut} />
                        {canManage ? (
                          <DeleteButton action={deleteTache.bind(null, t.id)} label="" />
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
