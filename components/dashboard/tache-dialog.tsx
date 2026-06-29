"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TACHE_PRIORITES, prioriteLabels } from "@/lib/domain"
import { createTache } from "@/app/dashboard/taches/actions"

export function TacheDialog({ dossierId }: { dossierId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(formData: FormData) {
    const titre = String(formData.get("titre") || "").trim()
    if (!titre) {
      toast.error("Le titre est requis.")
      return
    }
    startTransition(async () => {
      try {
        await createTache({
          titre,
          description: String(formData.get("description") || ""),
          priorite: String(formData.get("priorite") || "NORMALE"),
          dateEcheance: String(formData.get("dateEcheance") || ""),
          dossierId,
        })
        toast.success("Tâche créée.")
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Création impossible.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="size-4" /> Ajouter
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" name="titre" placeholder="Ex: Vérifier les pièces justificatives" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité</Label>
              <Select name="priorite" defaultValue="NORMALE">
                <SelectTrigger id="priorite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TACHE_PRIORITES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {prioriteLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEcheance">Échéance</Label>
              <Input id="dateEcheance" name="dateEcheance" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création..." : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
