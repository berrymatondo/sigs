import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react"
import { getCompanySettings } from "@/lib/company-settings"

export const metadata: Metadata = {
  title: "Contact | SIGS",
  description: "Contactez l'agence SIGS par téléphone, email ou via notre formulaire.",
}

// Strips spaces and non-dialable characters to build tel:/wa.me links.
//ok
function digitsOnly(value: string) {
  return value.replace(/[^\d+]/g, "")
}

export default async function ContactPage() {
  const settings = await getCompanySettings()

  const channels = [
    { icon: Phone, label: "Téléphone", value: settings.telephone, href: `tel:${digitsOnly(settings.telephone)}` },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: settings.whatsapp,
      href: `https://wa.me/${digitsOnly(settings.whatsapp).replace(/^\+/, "")}`,
    },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Adresse", value: settings.adresse, href: undefined },
  ]

  return (
    <>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight">Contactez-nous</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Une question, un projet ? Notre équipe vous répond dans les meilleurs délais.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {channels.map((c) => {
            const inner = (
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="size-5" />
                </span>
                <div>
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                  <div className="font-medium">{c.value}</div>
                </div>
              </CardContent>
            )
            return (
              <Card key={c.label} className="transition-shadow hover:shadow-sm">
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  inner
                )}
              </Card>
            )
          })}

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="size-5" />
              </span>
              <div>
                <div className="text-sm text-muted-foreground">Horaires</div>
                <div className="font-medium">{settings.horaires}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-1 text-xl font-semibold">Envoyez-nous un message</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Les champs marqués d'un astérisque (*) sont obligatoires.
              </p>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Localisation de l'agence SIGS à Kinshasa"
            src="https://www.openstreetmap.org/export/embed.html?bbox=15.28%2C-4.33%2C15.33%2C-4.29&layer=mapnik"
            className="h-80 w-full border-0"
            loading="lazy"
          />
        </div>
      </section>
    </>
  )
}
