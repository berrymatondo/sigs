"use client"

import Image from "next/image"
import { Briefcase, Code2, Layers, ListChecks } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { docSections, type DocPageDoc } from "@/lib/documentation"

function PageDetail({ page }: { page: DocPageDoc }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {page.route}
        </code>
        {page.audience.map((a) => (
          <Badge key={a} variant="secondary" className="text-xs">
            {a}
          </Badge>
        ))}
      </div>

      {page.screenshot ? (
        <figure className="overflow-hidden rounded-lg border bg-muted/30">
          <Image
            src={page.screenshot || "/placeholder.svg"}
            alt={page.screenshotAlt || `Capture d'écran de la page ${page.title}`}
            width={1280}
            height={860}
            className="h-auto w-full"
          />
          <figcaption className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Aperçu de la page{" "}
            <code className="font-mono">{page.route}</code>
          </figcaption>
        </figure>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Briefcase className="size-4 text-primary" aria-hidden />
            Métier
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{page.business}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Code2 className="size-4 text-primary" aria-hidden />
            Technique
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{page.technical}</p>
        </div>
      </div>

      {page.walkthrough && page.walkthrough.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="size-4 text-primary" aria-hidden />
            Comment ça marche
          </div>
          <ol className="flex flex-col gap-2.5">
            {page.walkthrough.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-pretty leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="size-4 text-primary" aria-hidden />
          Fonctionnalités clés
        </div>
        <ul className="flex flex-wrap gap-2">
          {page.features.map((f) => (
            <li
              key={f}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
            >
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function DocumentationContent() {
  return (
    <div className="flex flex-col gap-10">
      {docSections.map((section) => (
        <section key={section.id} aria-labelledby={`sec-${section.id}`} className="flex flex-col gap-4">
          <div>
            <h2 id={`sec-${section.id}`} className="text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{section.description}</p>
          </div>

          {/* Mobile: accordion */}
          <div className="md:hidden">
            <Accordion type="single" collapsible className="w-full">
              {section.pages.map((page, i) => (
                <AccordionItem key={page.route} value={`${section.id}-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {page.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <PageDetail page={page} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Desktop: cards */}
          <div className="hidden flex-col gap-4 md:flex">
            {section.pages.map((page) => (
              <Card key={page.route}>
                <CardHeader>
                  <CardTitle className="text-base">{page.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PageDetail page={page} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
