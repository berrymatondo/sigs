"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Star, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { submitAvis, type AvisState } from "@/app/(public)/avis/actions"

export function AvisForm() {
  const [state, action, pending] = useActionState<AvisState, FormData>(submitAvis, null)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(5)
  const [hover, setHover] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message)
      formRef.current?.reset()
      setNote(5)
      setOpen(false)
    } else if (state && !state.ok) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        <MessageSquarePlus className="size-4" />
        Laisser un avis
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partagez votre expérience</DialogTitle>
          <DialogDescription>
            Votre avis aide d&apos;autres voyageurs à nous faire confiance.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <input type="hidden" name="note" value={note} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="avis-nom">Nom *</Label>
              <Input id="avis-nom" name="nom" required placeholder="Votre nom" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avis-role">
                Rôle <span className="text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="avis-role" name="role" placeholder="Ex. Cliente Visa" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Note</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1
                const filled = (hover || note) >= value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={note === value}
                    aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                    onClick={() => setNote(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    className="rounded p-0.5 text-primary transition-transform hover:scale-110"
                  >
                    <Star className={`size-6 ${filled ? "fill-current" : "text-muted-foreground/40"}`} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="avis-texte">Votre commentaire *</Label>
            <Textarea
              id="avis-texte"
              name="texte"
              required
              rows={4}
              maxLength={500}
              placeholder="Décrivez votre expérience avec SIGS..."
            />
          </div>
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Publication..." : "Publier mon avis"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
