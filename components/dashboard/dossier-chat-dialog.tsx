"use client"

import { useState } from "react"
import { MessageSquare, ArrowUpRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DossierChat } from "@/components/dashboard/dossier-chat"

type Sender = { id: string; name: string; image: string | null; role: string }
type MessageItem = { id: string; texte: string; createdAt: string | Date; sender: Sender }

export function DossierChatDialog({
  dossierId,
  dossierNom,
  currentUserId,
  initialMessages,
  counterpartLabel,
}: {
  dossierId: string
  dossierNom: string
  currentUserId: string
  initialMessages: MessageItem[]
  counterpartLabel: string
}) {
  const [open, setOpen] = useState(false)
  const lastMessage = initialMessages[initialMessages.length - 1]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-secondary/50"
          />
        }
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-to text-primary-foreground">
          <MessageSquare className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Messagerie</p>
            {initialMessages.length > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {initialMessages.length}
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {lastMessage ? lastMessage.texte : `Échangez avec ${counterpartLabel} à propos de ce dossier`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
          Ouvrir <ArrowUpRight className="size-3.5" />
        </span>
      </DialogTrigger>

      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-primary" />
            {dossierNom}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {open ? (
            <DossierChat dossierId={dossierId} currentUserId={currentUserId} initialMessages={initialMessages} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
