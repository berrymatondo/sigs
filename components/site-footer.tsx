import Link from "next/link"
import { SiteLogo } from "@/components/site-logo"
import { Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <SiteLogo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            SIGS accompagne les voyageurs et les entreprises dans leurs démarches
            administratives : visas, location de véhicules, assurances et
            réservations. Un suivi de dossier transparent, de A à Z.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Navigation</h3>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">Accueil</Link></li>
            <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/sign-in" className="hover:text-foreground">Connexion</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" /> +243 81 234 56 78
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" /> contact@sigs-agence.cd
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" /> Boulevard du 30 Juin, Kinshasa
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          {`© ${new Date().getFullYear()} SIGS - Système d'Information de Gestion de Services. Tous droits réservés.`}
        </div>
      </div>
    </footer>
  )
}
