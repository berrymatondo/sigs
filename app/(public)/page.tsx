import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, ArrowRight, Quote, Star } from "lucide-react"
import { AvisForm } from "@/components/avis-form"
import { getAvis } from "@/app/(public)/avis/actions"

const services = [
  { image: "/service-card-visa.png", title: "Demande de Visa", desc: "Constitution et suivi complet de vos demandes de visa pour toutes destinations." },
  { image: "/service-card-voiture.png", title: "Location de Voiture", desc: "Réservation de véhicules adaptés à vos déplacements professionnels ou personnels." },
  { image: "/service-card-assurance.png", title: "Assurance Voyage", desc: "Des couvertures sur mesure pour voyager l'esprit tranquille." },
  { image: "/service-card-hotel.png", title: "Réservation Hôtel", desc: "Sélection et réservation d'hébergements partout dans le monde." },
  { image: "/service-card-passeport.png", title: "Demande de Passeport", desc: "Assistance administrative pour vos titres de voyage." },
  { image: "/service-card-assistance.png", title: "Assistance Administrative", desc: "Accompagnement personnalisé pour toutes vos démarches." },
]

const stats = [
  { value: "12k+", label: "Dossiers traités" },
  { value: "98%", label: "Clients satisfaits" },
  { value: "45", label: "Destinations" },
  { value: "24/7", label: "Suivi en ligne" },
]

const testimonials = [
  { name: "Amina K.", role: "Cliente Visa", text: "Démarche fluide et suivi en temps réel. J'ai obtenu mon visa sans stress.", photo: "/testimonial-amina.png" },
  { name: "Thomas R.", role: "Voyageur d'affaires", text: "La location de voiture et l'assurance gérées au même endroit, un vrai gain de temps.", photo: "/testimonial-thomas.png" },
  { name: "Sofia L.", role: "Étudiante", text: "Une équipe réactive qui m'a accompagnée pour mon passeport et mon assurance.", photo: "/testimonial-sofia.png" },
]

export default async function AccueilPage() {
  const avis = await getAvis()

  // Show visitor reviews from the database; fall back to the default
  // testimonials when none have been submitted yet so the section is never empty.
  const reviews =
    avis.length > 0
      ? avis.map((a) => ({
          id: a.id,
          name: a.nom,
          role: a.role ?? "Client",
          text: a.texte,
          note: a.note,
          photo: null as string | null,
        }))
      : testimonials.map((t) => ({
          id: t.name,
          name: t.name,
          role: t.role,
          text: t.text,
          note: 5,
          photo: t.photo as string | null,
        }))

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="animate-float pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/5 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6">
            <span className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Agence de services agréée
            </span>
            <h1 className="animate-fade-up delay-100 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Vos démarches de voyage, simplifiées et suivies de bout en bout
            </h1>
            <p className="animate-fade-up delay-200 text-pretty text-lg leading-relaxed text-muted-foreground">
              Visa, location de voiture, assurance, hôtel : confiez vos dossiers à
              SIGS et suivez leur avancement en temps réel depuis votre espace
              personnel.
            </p>
            <div className="animate-fade-up delay-300 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="transition-transform hover:scale-[1.02]">
                <Link href="/sign-up">
                  Créer mon compte
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="transition-transform hover:scale-[1.02]">
                <Link href="/services">Découvrir les services</Link>
              </Button>
            </div>
          </div>
          <div className="animate-fade-in delay-200 relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm">
            <Image
              src="/hero-travel.png"
              alt="Conseiller SIGS accompagnant un client dans ses démarches de voyage"
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-up text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight">
            Des services pensés pour les voyageurs
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Une gamme complète de prestations gérées par une équipe d'experts
            dédiée à votre projet.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card
              key={s.title}
              className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-3 p-0">
                <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-xl border-b border-border">
                  <Image
                    src={s.image || "/placeholder.svg"}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </span>
                <div className="flex flex-col gap-2 p-6 pt-3">
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight">
              Ils nous font confiance
            </h2>
            <AvisForm />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-col gap-4 p-6">
                  <Quote className="size-6 text-primary/40" />
                  <p className="text-sm leading-relaxed text-foreground">{t.text}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.photo ? (
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border">
                          <Image
                            src={t.photo || "/placeholder.svg"}
                            alt={`Portrait de ${t.name}`}
                            fill
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary"
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${i < t.note ? "fill-current" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
          <h2 className="text-balance text-3xl font-bold tracking-tight">
            Prêt à lancer votre première demande ?
          </h2>
          <p className="max-w-xl text-pretty text-primary-foreground/80">
            Créez votre compte gratuitement et soumettez votre dossier en quelques
            minutes. Notre équipe s'occupe du reste.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sign-up">
              Créer mon compte
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
