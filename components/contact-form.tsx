"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitContact, type ContactState } from "@/app/(public)/contact/actions"
import { Send } from "lucide-react"

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message)
      formRef.current?.reset()
    } else if (state && !state.ok) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nom">Nom complet *</Label>
          <Input id="nom" name="nom" required placeholder="Votre nom" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="telephone">Téléphone (facultatif)</Label>
          <Input id="telephone" name="telephone" type="tel" placeholder="+243 000 000 000" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sujet">Sujet *</Label>
          <Input id="sujet" name="sujet" required placeholder="Objet de votre message" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" name="message" required rows={5} placeholder="Décrivez votre demande..." />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        <Send className="size-4" />
        {pending ? "Envoi..." : "Envoyer le message"}
      </Button>
    </form>
  )
}
