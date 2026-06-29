import { MessageSquare, Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { requireRole } from "@/lib/session"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getAvisAdmin, deleteAvis } from "./actions"

export default async function AvisModerationPage() {
  await requireRole(["ADMIN"])
  const avis = await getAvisAdmin()

  return (
    <div>
      <PageHeader
        title="Avis des visiteurs"
        description="Consultez et modérez les avis publiés sur la page d'accueil."
      />

      {avis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <MessageSquare className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {avis.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <Quote className="size-5 text-primary/40" />
                  <div className="flex gap-0.5 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${i < a.note ? "fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{a.texte}</p>
                <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{a.nom}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.role ?? "Client"} · {format(a.createdAt, "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <DeleteButton
                    action={deleteAvis.bind(null, a.id)}
                    label=""
                    description="Cet avis sera définitivement supprimé de la page d'accueil."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
