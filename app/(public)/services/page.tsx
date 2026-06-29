import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Nos services | SIGS",
  description: "Découvrez tous les services proposés par SIGS : visa, location de voiture, assurance voyage, hôtel et assistance administrative.",
}

const detailed = [
  {
    image: "/service-visa.png",
    title: "Demande de Visa",
    price: "À partir de 95 $",
    desc: "Nous constituons et déposons votre dossier de visa, et assurons le suivi jusqu'à l'obtention.",
    docs: ["Passeport valide", "Photos d'identité", "Justificatif de domicile", "Réservation de voyage"],
  },
  {
    image: "/service-voiture.png",
    title: "Location de Voiture",
    price: "À partir de 40 $/jour",
    desc: "Citadines, berlines, SUV ou utilitaires : nous trouvons le véhicule adapté à votre besoin.",
    docs: ["Permis de conduire valide", "Pièce d'identité", "Carte bancaire", "Justificatif de domicile"],
  },
  {
    image: "/service-assurance.png",
    title: "Assurance Voyage",
    price: "À partir de 20 $",
    desc: "Frais médicaux, rapatriement, annulation : des garanties complètes pour tous vos déplacements.",
    docs: ["Pièce d'identité", "Dates de voyage", "Destination"],
  },
  {
    image: "/service-hotel.png",
    title: "Réservation Hôtel",
    price: "Sans frais de dossier",
    desc: "Nous sélectionnons et réservons votre hébergement selon votre budget et vos préférences.",
    docs: ["Dates de séjour", "Nombre de voyageurs", "Ville de destination"],
  },
  {
    image: "/service-passeport.png",
    title: "Demande de Passeport",
    price: "À partir de 55 $",
    desc: "Assistance pour la préparation et le dépôt de votre demande de passeport.",
    docs: ["Acte de naissance", "Photos d'identité", "Justificatif de domicile"],
  },
  {
    image: "/service-assistance.png",
    title: "Assistance Administrative",
    price: "Sur devis",
    desc: "Un accompagnement personnalisé pour toutes vos démarches administratives complexes.",
    docs: ["Selon le dossier"],
  },
]

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <Badge variant="secondary" className="mb-4">Nos prestations</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight">
            Tous nos services en un seul endroit
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Des solutions complètes pour vos voyages et démarches administratives,
            avec un suivi transparent à chaque étape.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {detailed.map((s) => (
            <Card key={s.title} className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src={s.image || "/placeholder.svg"}
                  alt={s.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{s.title}</CardTitle>
                <Badge variant="outline" className="w-fit">{s.price}</Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <div className="mt-auto">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Documents requis
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {s.docs.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">Une question sur un service ?</h2>
          <p className="max-w-lg text-muted-foreground">
            Notre équipe est disponible pour vous conseiller et constituer votre dossier.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Créer un compte</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
