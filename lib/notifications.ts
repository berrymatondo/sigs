import { prisma } from "@/lib/prisma"

export async function createNotification(params: {
  userId: string
  type: string
  titre: string
  texte: string
  lien?: string
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      titre: params.titre,
      texte: params.texte,
      lien: params.lien ?? null,
    },
  })
}
