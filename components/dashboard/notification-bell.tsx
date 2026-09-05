"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, MessageSquare, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/dashboard/notifications-actions"

type NotificationItem = {
  id: string
  type: string
  titre: string
  texte: string
  lien: string | null
  lu: boolean
  createdAt: string | Date
}

const POLL_INTERVAL_MS = 10000

function formatTime(date: string | Date) {
  const d = new Date(date)
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

const iconByType: Record<string, typeof MessageSquare> = {
  MESSAGE: MessageSquare,
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { notifications: fresh, unreadCount: freshCount } = await getNotifications()
        setNotifications(fresh as NotificationItem[])
        setUnreadCount(freshCount)
      } catch {
        // A transient poll failure isn't worth surfacing; it retries itself.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  async function handleOpen(item: NotificationItem) {
    if (!item.lu) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, lu: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      await markNotificationRead(item.id)
    }
    setOpen(false)
    if (item.lien) router.push(item.lien)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
    setUnreadCount(0)
    await markAllNotificationsRead()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" /> Tout marquer comme lu
            </button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            notifications.map((n) => {
              const Icon = iconByType[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50",
                    !n.lu && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      !n.lu ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!n.lu ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
                      <p className="truncate text-sm font-medium">{n.titre}</p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{n.texte}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatTime(n.createdAt)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
