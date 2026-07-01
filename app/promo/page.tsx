import type { Metadata } from "next"
import { PromoReel } from "@/components/promo/promo-reel"

export const metadata: Metadata = {
  title: "SIGS — Présentation 30s",
  description: "Vidéo de présentation animée de SIGS, la plateforme de gestion de services pour Kinshasa.",
}

export default function PromoPage() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-[#0a0e1f]">
      <PromoReel />
    </main>
  )
}
