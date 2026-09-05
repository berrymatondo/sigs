"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarBadge } from "@/components/dashboard/avatar-badge"
import { cn } from "@/lib/utils"
import { roleLabels } from "@/lib/domain"
import { getMessages, sendMessage } from "@/app/dashboard/dossiers/messages-actions"

type Sender = { id: string; name: string; image: string | null; role: string }
type MessageItem = { id: string; texte: string; createdAt: string | Date; sender: Sender }

const POLL_INTERVAL_MS = 4000

function formatTime(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (sameDay) return time
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${time}`
}

export function DossierChat({
  dossierId,
  currentUserId,
  initialMessages,
}: {
  dossierId: string
  currentUserId: string
  initialMessages: MessageItem[]
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Poll for new messages so both sides see replies without a manual refresh.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { messages: fresh } = await getMessages(dossierId)
        setMessages(fresh as MessageItem[])
      } catch {
        // Transient errors (e.g. a brief DB blip) shouldn't spam the user; the
        // next tick retries on its own.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [dossierId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  function handleSend() {
    const texte = draft.trim()
    if (!texte) return
    setDraft("")
    startTransition(async () => {
      try {
        const message = await sendMessage(dossierId, texte)
        setMessages((prev) => [...prev, message as MessageItem])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Envoi impossible.")
        setDraft(texte)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex h-[28rem] flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Aucun message pour le moment. Démarrez la conversation.
          </div>
        ) : (
          messages.map((m) => {
            const own = m.sender.id === currentUserId
            return (
              <div key={m.id} className={cn("flex items-end gap-2", own && "flex-row-reverse")}>
                <AvatarBadge name={m.sender.name} image={m.sender.image} size="size-7" />
                <div className={cn("flex max-w-[75%] flex-col gap-1", own && "items-end")}>
                  <span className="text-xs text-muted-foreground">
                    {own ? "Vous" : m.sender.name} · {roleLabels[m.sender.role] ?? m.sender.role} ·{" "}
                    {formatTime(m.createdAt)}
                  </span>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
                      own
                        ? "rounded-br-sm bg-linear-to-r from-primary to-primary-to text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.texte}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      <CardContent className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message... (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
          rows={2}
          className="resize-none"
        />
        <Button onClick={handleSend} disabled={pending || !draft.trim()} size="icon" aria-label="Envoyer">
          <Send className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
