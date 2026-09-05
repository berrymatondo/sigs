"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function getNotifications() {
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
}

export async function markNotificationRead(id: string) {
  const user = await requireUser()
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { lu: true } })
}

export async function markAllNotificationsRead() {
  const user = await requireUser()
  await prisma.notification.updateMany({ where: { userId: user.id, lu: false }, data: { lu: true } })
}
