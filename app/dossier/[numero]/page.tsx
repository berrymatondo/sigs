import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export default async function DossierResolverPage({
  params,
}: {
  params: Promise<{ numero: string }>
}) {
  const { numero } = await params

  // Require authentication. Unauthenticated scans are sent to sign-in,
  // then returned to this resolver once logged in.
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/sign-in?redirect=${encodeURIComponent(`/dossier/${numero}`)}`)
  }

  const dossier = await prisma.dossier.findUnique({
    where: { numero },
    include: { client: true },
  })
  if (!dossier) notFound()

  // Visitors (clients) may only open their own dossier; otherwise show read-only tracking.
  if (user.role === "VISITEUR" && dossier.client.userId !== user.id) {
    redirect(`/suivi/${dossier.numero}`)
  }

  // Authenticated and authorized: open the full dossier detail page.
  redirect(`/dashboard/dossiers/${dossier.id}`)
}
