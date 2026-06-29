"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { DOCUMENT_TYPES } from "@/lib/domain"
import { createDocument } from "@/app/dashboard/documents/actions"

export function DocumentDialog({
  dossierId,
  clientId,
  userId,
}: {
  dossierId?: string | null
  clientId?: string | null
  userId?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  function onSubmit(formData: FormData) {
    const titre = String(formData.get("titre") || "").trim()
    const type = String(formData.get("type") || "PDF")
    if (!titre) {
      toast.error("Le titre est requis.")
      return
    }
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.")
      return
    }
    startTransition(async () => {
      try {
        // 1. Upload the file to private blob storage.
        const uploadData = new FormData()
        uploadData.append("file", file)
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: uploadData,
        })
        if (!res.ok) throw new Error("upload")
        const { pathname, taille } = (await res.json()) as {
          pathname: string
          taille: number
        }

        // 2. Persist the document record in the database.
        await createDocument({
          titre,
          type,
          fichier: pathname,
          taille,
          dossierId: dossierId ?? undefined,
          clientId: clientId ?? undefined,
          userId: userId ?? undefined,
        })
        toast.success("Document ajouté.")
        setFile(null)
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Ajout impossible.")
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
          <DialogTitle>Ajouter un document</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" name="titre" placeholder="Ex: Passeport scanné" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="PDF">
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fichier">Fichier</Label>
            <Input
              id="fichier"
              name="fichier"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(0)} Ko
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Ajout..." : "Ajouter le document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
