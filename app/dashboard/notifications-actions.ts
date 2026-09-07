"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

// Called on every dashboard page load (layout) to feed the notification
// bell, so a transient DB hiccup here must not crash the whole dashboard —
// degrade to "no notifications" instead, same as getAvis() on the homepage.
export async function getNotifications() {
  try {
    const user = await requireUser()
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: user.id, lu: false } }),
    ])
    return { notifications, unreadCount }
  } catch (error) {
    // Let Next's redirect()/notFound() signals (thrown as special errors)
    // propagate — only swallow genuine failures like a DB connectivity blip.
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_")) {
      throw error
    }
    console.log("[v0] Échec du chargement des notifications:", (error as Error).message)
    return { notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationRead(id: string) {
  const user = await requireUser()
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { lu: true } })
}

export async function markAllNotificationsRead() {
  const user = await requireUser()
  await prisma.notification.updateMany({ where: { userId: user.id, lu: false }, data: { lu: true } })
}
