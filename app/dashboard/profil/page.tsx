import { FileText, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { ChangePasswordForm } from "@/components/dashboard/change-password-form"
import { DocumentDialog } from "@/components/dashboard/document-dialog"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { roleLabels } from "@/lib/domain"
import { deleteDocument } from "@/app/dashboard/documents/actions"
import { getMyProfile, getMyProfileDocuments } from "./actions"

export default async function ProfilPage() {
  const { user } = await getMyProfile()
  const documents = await getMyProfileDocuments()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Mon profil" description="Gérez vos informations personnelles." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Informations · <span className="text-muted-foreground">{roleLabels[user.role]}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={user.name}
            defaultPhone={user.phone ?? ""}
            email={user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sécurité</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Modifiez votre mot de passe. Les autres sessions seront déconnectées.
          </p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Mes documents</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Carte d&apos;identité, passeport et autres pièces personnelles.
            </p>
          </div>
          <DocumentDialog userId={user.id} />
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun document pour l&apos;instant.
            </p>
          ) : (
            documents.map((doc) => (
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
                    <a
                      href={`/api/documents/file?pathname=${encodeURIComponent(doc.fichier)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
    </div>
  )
}
