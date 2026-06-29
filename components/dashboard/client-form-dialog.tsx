"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient, updateClient, type ClientInput } from "@/app/dashboard/clients/actions"

type ClientData = ClientInput & { id: string }

export function ClientFormDialog({ client }: { client?: ClientData }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = Boolean(client)

  function onSubmit(formData: FormData) {
    const payload: ClientInput = {
      nom: String(formData.get("nom") || "").trim(),
      postnom: String(formData.get("postnom") || "").trim(),
      prenom: String(formData.get("prenom") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      telephone: String(formData.get("telephone") || "").trim(),
      adresse: String(formData.get("adresse") || "").trim(),
      dateNaissance: String(formData.get("dateNaissance") || ""),
    }
    if (!payload.nom || !payload.email) {
      toast.error("Le nom et l'email sont obligatoires.")
      return
    }
    startTransition(async () => {
      try {
        if (isEdit && client) {
          await updateClient(client.id, payload)
          toast.success("Client mis à jour.")
        } else {
          await createClient(payload)
          toast.success("Client créé.")
        }
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Une erreur est survenue.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={isEdit ? <Button variant="outline" size="sm" /> : <Button />}
      >
        {isEdit ? (
          <>
            <Pencil className="size-4" /> Modifier
          </>
        ) : (
          <>
            <Plus className="size-4" /> Nouveau client
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations du client.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" defaultValue={client?.nom} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postnom">Postnom <span className="text-muted-foreground">(facultatif)</span></Label>
              <Input id="postnom" name="postnom" defaultValue={client?.postnom ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom <span className="text-muted-foreground">(facultatif)</span></Label>
              <Input id="prenom" name="prenom" defaultValue={client?.prenom ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={client?.email} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" name="telephone" defaultValue={client?.telephone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <Input id="dateNaissance" name="dateNaissance" type="date" defaultValue={client?.dateNaissance} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" name="adresse" defaultValue={client?.adresse} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
