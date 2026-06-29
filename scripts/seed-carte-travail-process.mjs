import { PrismaClient } from "../lib/generated/prisma/index.js"

const prisma = new PrismaClient()

// Indicative document list (from the "Dossier à fournir" panel).
const documentsIndicatifs = [
  "Formulaire de demande de carte de travail (acheté au Ministère du Travail)",
  "Lettre de transmission (fournie à l'achat du formulaire)",
  "État nominatif (fourni à l'achat du formulaire)",
  "2 photos passeport",
  "Certificat de service ou diplôme",
  "Attestation médicale",
  "Preuve de contribution INPP et INSS de la société",
  "Curriculum vitae (CV)",
  "Attestation de service (en cas de changement d'employeur)",
]

// Other documents possibly required.
const autresDocuments = [
  "Copie du passeport",
  "Visa ou titre de séjour valide",
  "Contrat de travail signé",
  "Statuts de la société",
  "RCCM de la société",
  "Numéro d'identification nationale (ID.NAT)",
  "Attestation fiscale de l'entreprise",
]

const steps = [
  {
    nom: "Dépôt et examen du dossier au niveau de la CNEE",
    dureeJours: 7,
    description:
      "Dépôt du dossier complet au Ministère du Travail pour examen par la Commission Nationale de l'Emploi des Étrangers (CNEE). Échéance : Semaine 1.",
    subSteps: [
      { nom: "Documents du dossier (liste indicative)", documentsRequis: documentsIndicatifs },
      { nom: "Autres documents possiblement requis", documentsRequis: autresDocuments },
    ],
  },
  {
    nom: "Signature du procès-verbal par la CNEE et émission de la note de perception",
    dureeJours: 7,
    description:
      "La CNEE statue sur le dossier et signe le procès-verbal favorable. Une note de perception est émise. Échéance : Semaine 2.",
    subSteps: [],
  },
  {
    nom: "Paiement de la note de perception",
    dureeJours: 2,
    description:
      "Paiement de la note de perception à la banque et obtention de l'attestation de paiement. Échéance : Semaine 2.",
    subSteps: [{ nom: "Attestation de paiement", documentsRequis: ["Attestation de paiement bancaire"] }],
  },
  {
    nom: "Programmation de la capture",
    dureeJours: 5,
    description:
      "Prise de rendez-vous pour la capture biométrique (photo et empreintes digitales). Échéance : Semaine 3.",
    subSteps: [],
  },
  {
    nom: "Capture biométrique",
    dureeJours: 5,
    description:
      "Capture biométrique (photo, empreintes) de l'étranger au centre de capture agréé. Échéance : Semaine 4.",
    subSteps: [],
  },
  {
    nom: "Production et remise de la carte de travail",
    dureeJours: 2,
    description: "Fabrication de la carte de travail et remise au demandeur. Échéance : Semaine 4.",
    subSteps: [],
  },
  {
    nom: "Validation du contrat de travail à l'ONEM",
    dureeJours: 2,
    description:
      "Après obtention de la carte de travail, faire valider le contrat de travail auprès de l'ONEM. Échéance : Semaine 4 et plus.",
    subSteps: [{ nom: "Contrat validé", documentsRequis: ["Contrat de travail validé par l'ONEM"] }],
  },
]

async function main() {
  const nom = "Obtention de la carte de travail pour étranger en RDC"
  const existing = await prisma.processDefinition.findFirst({ where: { nom } })
  if (existing) {
    console.log("[v0] Process déjà existant, aucune action:", existing.id)
    return
  }

  const created = await prisma.processDefinition.create({
    data: {
      nom,
      description:
        "Processus complet d'obtention de la carte de travail pour un étranger en RDC. Durée totale : 3 semaines à 1 mois. Coût total : à partir de 700 $ (et plus selon le domaine). Frais administratifs : 283 $.",
      dureeJours: 30,
      cout: 700,
      actif: true,
      steps: {
        create: steps.map((step, i) => ({
          ordre: i + 1,
          nom: step.nom,
          dureeJours: step.dureeJours,
          description: step.description,
          subSteps: {
            create: step.subSteps.map((sub, j) => ({
              ordre: j + 1,
              nom: sub.nom,
              documentsRequis: sub.documentsRequis,
            })),
          },
        })),
      },
    },
    include: { steps: { include: { subSteps: true } } },
  })

  console.log("[v0] Process créé:", created.id)
  console.log("[v0] Étapes:", created.steps.length)
}

main()
  .catch((e) => {
    console.error("[v0] Erreur:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
