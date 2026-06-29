// Single source of truth for the in-app documentation.
// Consumed by the Documentation page UI (desktop + mobile accordion) and by the
// two PDF generators (full documentation and cahier des charges).

export type DocPageDoc = {
  title: string
  route: string
  audience: string[]
  business: string
  technical: string
  features: string[]
  // Path to a real screenshot of the page (served from /public).
  screenshot?: string
  // Optional alt text describing the screenshot for accessibility.
  screenshotAlt?: string
  // Step-by-step walkthrough giving a detailed, concrete explanation of how to
  // use the page (rendered as an ordered list in the UI).
  walkthrough?: string[]
}

export type DocSection = {
  id: string
  title: string
  description: string
  pages: DocPageDoc[]
}

export const APP_NAME = "SIGS — Système Intégré de Gestion de Services"

export const APP_OVERVIEW = {
  pitch:
    "SIGS est une plateforme de gestion d'agence de services (visa, passeport, location de voiture, assurance voyage, réservation d'hôtel). Elle centralise les clients, les dossiers, les documents, les tâches et le pilotage des processus métier, avec un suivi public par QR code et un reporting analytique.",
  stack: [
    "Next.js 16 (App Router, React Server Components)",
    "PostgreSQL géré via Neon + ORM Prisma",
    "Authentification et sessions via Better Auth (email + mot de passe)",
    "Stockage de fichiers via Vercel Blob",
    "Génération PDF côté serveur via pdf-lib",
    "Visualisations via Recharts + composants shadcn/ui",
    "UI : shadcn/ui, Tailwind CSS v4, design responsive mobile-first",
  ],
  roles: [
    { role: "Visiteur", desc: "Client final : consulte ses propres dossiers en lecture seule, télécharge ses documents." },
    { role: "Agent", desc: "Traite les dossiers, gère clients, documents et tâches au quotidien." },
    { role: "Manager", desc: "Pilote l'activité : accès aux process, à l'analytique et au reporting stratégique." },
    { role: "Administrateur", desc: "Contrôle total : gestion des utilisateurs, des rôles et de la configuration." },
  ],
}

export const docSections: DocSection[] = [
  {
    id: "public",
    title: "Espace public",
    description: "Pages accessibles sans authentification, vitrine et suivi client.",
    pages: [
      {
        title: "Page d'accueil",
        route: "/",
        audience: ["Public"],
        business:
          "Vitrine de l'agence : présente la proposition de valeur, les services phares et incite à la prise de contact ou au suivi de dossier. C'est le premier point d'entrée commercial.",
        technical:
          "Route publique servie par le route group app/(public). Composant serveur statique, optimisé SEO via les métadonnées du layout racine. Aucun appel base de données.",
        features: ["Présentation des services", "Appels à l'action (contact, suivi)", "Navigation vers l'authentification"],
        screenshot: "/docs/home.png",
        screenshotAlt: "Page d'accueil publique de SIGS avec la proposition de valeur et les appels à l'action.",
        walkthrough: [
          "Le visiteur arrive sur la section héro qui résume la proposition de valeur de l'agence et propose deux actions : suivre un dossier ou prendre contact.",
          "En faisant défiler, il découvre les services phares, les chiffres de réassurance et les avis clients publiés depuis la modération.",
          "Le bouton « Se connecter » de l'en-tête redirige le personnel et les clients enregistrés vers /sign-in.",
          "Aucune donnée sensible n'est exposée : la page est entièrement statique et optimisée pour le référencement.",
        ],
      },
      {
        title: "Services",
        route: "/services",
        audience: ["Public"],
        business:
          "Détaille chaque service proposé (visa, passeport, location, assurance, hôtel), les documents requis et permet au prospect de demander à être contacté depuis chaque carte.",
        technical:
          "Page serveur statique. Données de services décrites en dur dans le composant, rendues sous forme de cartes responsive. Bouton « Nous contacter » par carte redirigeant vers /contact.",
        features: ["Catalogue de services", "Liste des documents requis", "CTA contact par service"],
        screenshot: "/docs/services.png",
        screenshotAlt: "Page Services présentant les prestations sous forme de cartes détaillées.",
        walkthrough: [
          "Chaque service (visa, passeport, location de voiture, assurance voyage, réservation d'hôtel) est présenté dans une carte dédiée.",
          "La carte détaille la prestation et la liste des documents requis pour constituer une demande.",
          "Le bouton « Nous contacter » de chaque carte renvoie vers le formulaire /contact pré-contextualisé.",
          "La grille est responsive : les cartes passent sur une seule colonne sur mobile.",
        ],
      },
      {
        title: "Contact",
        route: "/contact",
        audience: ["Public"],
        business:
          "Permet à un prospect d'envoyer une demande de renseignement. Capte les leads commerciaux. Les coordonnées de l'agence (téléphone, WhatsApp, email, adresse, horaires) affichées à gauche sont gérées par l'administrateur et mises à jour en temps réel.",
        technical:
          "Page serveur lisant les coordonnées éditables depuis la table CompanySettings (helper lib/company-settings.ts). Formulaire (nom, email, téléphone facultatif, sujet et message obligatoires) validé côté client et côté serveur, puis traité par une server action. À l'envoi, deux emails sont expédiés via Resend : la demande vers l'email de contact de l'entreprise (avec replyTo du visiteur) et un accusé de réception au visiteur.",
        features: [
          "Coordonnées dynamiques (gérées par l'admin)",
          "Champs Nom, Email, Sujet et Message obligatoires",
          "Téléphone facultatif",
          "Email à l'entreprise + accusé de réception",
        ],
        screenshot: "/docs/contact.png",
        screenshotAlt: "Page Contact : coordonnées de l'agence à gauche et formulaire à droite avec sujet obligatoire.",
        walkthrough: [
          "À gauche, le visiteur consulte les coordonnées de l'agence (téléphone, WhatsApp, email, adresse, horaires), modifiables par l'administrateur depuis le tableau de bord.",
          "Il renseigne le formulaire : nom, email et sujet sont obligatoires (marqués d'un astérisque), le téléphone reste facultatif.",
          "À la soumission, une server action valide les champs puis envoie la demande à l'email de contact de l'entreprise et un accusé de réception au visiteur.",
          "Un message de confirmation s'affiche pour rassurer l'utilisateur sur la bonne réception.",
        ],
      },
      {
        title: "Suivi public de dossier",
        route: "/suivi/[numero]",
        audience: ["Public"],
        business:
          "Le client suit l'avancement de son dossier sans se connecter, à partir de son numéro de dossier. Réduit les appels au support et améliore la transparence.",
        technical:
          "Route dynamique paramétrée par le numéro de dossier. Lecture restreinte aux informations de statut (pas de données sensibles). Requête Prisma filtrée sur le numéro.",
        features: ["Recherche par numéro", "Affichage du statut et de l'étape", "Lecture seule"],
        screenshot: "/docs/suivi.png",
        screenshotAlt: "Page de suivi public affichant le statut d'un dossier à partir de son numéro.",
        walkthrough: [
          "Le client saisit (ou ouvre via un lien) le numéro de dossier, par exemple DOS-2026-100002.",
          "La page affiche le service concerné, l'intitulé, le titulaire et le statut courant du dossier.",
          "Seules les informations de suivi sont visibles : aucune donnée personnelle sensible n'est exposée.",
          "L'accès est en lecture seule et ne nécessite aucune authentification.",
        ],
      },
      {
        title: "Accès QR code",
        route: "/dossier/[numero]",
        audience: ["Public"],
        business:
          "Page atterrissage du QR code imprimé sur la fiche dossier : un scan ouvre directement le suivi du dossier concerné.",
        technical:
          "Route dynamique reliée au QR code généré (lib/domain → generateQrDataUrl). Redirige/affiche le suivi correspondant au numéro encodé.",
        features: ["Lien direct depuis QR", "Affichage synthétique du dossier"],
        screenshot: "/docs/sign-in.png",
        screenshotAlt: "Un scan non authentifié est redirigé vers la page de connexion avant d'ouvrir le dossier.",
        walkthrough: [
          "Le QR code imprimé sur la fiche dossier encode l'URL /dossier/{numero}.",
          "Cette route est un résolveur : si l'utilisateur n'est pas connecté, il est redirigé vers la connexion (capture ci-dessus) puis ramené automatiquement au dossier.",
          "Un visiteur connecté qui n'est pas propriétaire du dossier est redirigé vers le suivi public en lecture seule.",
          "Un membre du personnel (ou le client propriétaire) accède directement à la fiche complète du dossier.",
        ],
      },
    ],
  },
  {
    id: "auth",
    title: "Authentification",
    description: "Création de compte, connexion et récupération de mot de passe.",
    pages: [
      {
        title: "Connexion",
        route: "/sign-in",
        audience: ["Public"],
        business: "Point d'entrée sécurisé pour le personnel et les clients enregistrés.",
        technical:
          "Better Auth (email + mot de passe). Création de session sécurisée, redirection vers /dashboard. Hachage des mots de passe géré par Better Auth. Le champ mot de passe dispose d'un bouton (icône œil) pour afficher/masquer la saisie.",
        features: ["Email + mot de passe", "Affichage/masquage du mot de passe", "Gestion de session", "Lien mot de passe oublié"],
        screenshot: "/docs/sign-in.png",
        screenshotAlt: "Page de connexion avec champs email et mot de passe, et bouton œil pour afficher le mot de passe.",
        walkthrough: [
          "L'utilisateur saisit son email et son mot de passe puis valide avec « Se connecter ».",
          "Le bouton en forme d'œil dans le champ mot de passe permet d'afficher ou de masquer la saisie pour la vérifier.",
          "Better Auth vérifie les identifiants, crée une session sécurisée et redirige vers /dashboard.",
          "Le lien « Mot de passe oublié ? » lance le flux de réinitialisation et « Créer un compte » dirige vers l'inscription.",
        ],
      },
      {
        title: "Inscription",
        route: "/sign-up",
        audience: ["Public"],
        business: "Permet la création d'un compte client (rôle Visiteur par défaut).",
        technical:
          "Server action Better Auth créant l'utilisateur avec rôle VISITEUR par défaut. Validation des entrées et unicité de l'email.",
        features: ["Création de compte", "Rôle Visiteur par défaut", "Validation"],
        screenshot: "/docs/sign-up.png",
        screenshotAlt: "Formulaire d'inscription avec nom, postnom, prénom, téléphone, email et mot de passe.",
        walkthrough: [
          "Le visiteur renseigne son nom (obligatoire), son postnom et son prénom (facultatifs), son téléphone, son email et un mot de passe.",
          "La validation contrôle les champs obligatoires et l'unicité de l'email.",
          "Le compte est créé avec le rôle Visiteur par défaut puis l'utilisateur est connecté automatiquement.",
          "Un email de bienvenue est envoyé pour confirmer la création du compte.",
        ],
      },
      {
        title: "Mot de passe oublié / réinitialisation",
        route: "/forgot-password · /reset-password",
        audience: ["Public"],
        business: "Autonomie de l'utilisateur pour récupérer l'accès à son compte.",
        technical:
          "Flux Better Auth : demande de réinitialisation par email puis page de définition d'un nouveau mot de passe via jeton sécurisé.",
        features: ["Demande par email", "Jeton sécurisé", "Nouveau mot de passe"],
        screenshot: "/docs/forgot-password.png",
        screenshotAlt: "Page de demande de réinitialisation de mot de passe par email.",
        walkthrough: [
          "L'utilisateur saisit son email sur la page /forgot-password pour demander une réinitialisation.",
          "Better Auth envoie un email contenant un lien avec un jeton sécurisé à durée limitée.",
          "Le lien ouvre la page /reset-password où l'utilisateur définit un nouveau mot de passe.",
          "Après validation, il peut se reconnecter immédiatement avec ses nouveaux identifiants.",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Espace de travail (Dashboard)",
    description: "Cœur opérationnel réservé aux utilisateurs authentifiés.",
    pages: [
      {
        title: "Tableau de bord",
        route: "/dashboard",
        audience: ["Agent", "Manager", "Administrateur", "Visiteur"],
        business:
          "Vue d'ensemble de l'activité : indicateurs clés, dossiers récents et accès rapide aux actions courantes. Aligne l'équipe sur les priorités du jour.",
        technical:
          "Server component agrégeant les compteurs via Prisma (server actions dans app/dashboard/actions.ts). Cartes statistiques et listes rendues côté serveur. Contenu adapté selon le rôle de session.",
        features: ["KPI synthétiques", "Dossiers récents", "Raccourcis d'action"],
        screenshot: "/docs/dashboard.png",
        screenshotAlt: "Tableau de bord avec indicateurs clés et dossiers récents.",
        walkthrough: [
          "À la connexion, l'utilisateur arrive sur le tableau de bord qui synthétise l'activité.",
          "Les cartes d'indicateurs (KPI) affichent les compteurs clés agrégés en base via Prisma.",
          "La liste des dossiers récents permet d'ouvrir rapidement un dossier en cours.",
          "Le contenu et les raccourcis sont adaptés au rôle de l'utilisateur connecté.",
        ],
      },
      {
        title: "Clients",
        route: "/dashboard/clients · /dashboard/clients/[id]",
        audience: ["Agent", "Manager", "Administrateur"],
        business:
          "Référentiel clients : créer, consulter et mettre à jour les fiches, retrouver l'historique des dossiers d'un client. Base de la relation commerciale.",
        technical:
          "Liste paginée + fiche détail dynamique [id]. CRUD via server actions Prisma, scoping d'accès au personnel. Relations client → dossiers → documents chargées via include Prisma.",
        features: ["CRUD client", "Fiche détail + historique", "Recherche / filtre"],
        screenshot: "/docs/clients.png",
        screenshotAlt: "Liste des clients avec recherche et accès aux fiches détaillées.",
        walkthrough: [
          "La liste affiche tous les clients ; un champ de recherche permet de filtrer rapidement.",
          "Le bouton « Nouveau client » ouvre un formulaire de création (coordonnées, contact).",
          "Cliquer sur un client ouvre sa fiche détail [id] avec ses coordonnées, ses dossiers et ses documents.",
          "Depuis la fiche, l'agent peut modifier les informations, consulter l'historique et gérer les documents liés au client comme à son profil visiteur.",
        ],
      },
      {
        title: "Dossiers",
        route: "/dashboard/dossiers · /nouveau · /[id]",
        audience: ["Agent", "Manager", "Administrateur"],
        business:
          "Entité centrale du métier : chaque demande de service devient un dossier suivi de bout en bout (statut, étape de process, montant, documents, tâches). Pilote la production de l'agence.",
        technical:
          "Liste avec colonnes statut/étape, page de création liée à une instance de process, page détail [id] avec onglets (suivi process, documents, tâches). Génération PDF de la fiche (pdf-lib) et QR code de suivi. Accès visiteur en lecture seule.",
        features: [
          "Création liée à un process",
          "Suivi par stepper séquentiel",
          "Export PDF + QR code",
          "Documents & tâches rattachés",
        ],
        screenshot: "/docs/dossiers.png",
        screenshotAlt: "Liste des dossiers avec client, type, étape et statut.",
        walkthrough: [
          "La liste présente chaque dossier avec son client, son type de service, l'étape courante et le statut.",
          "Le filtre par statut et la recherche aident à retrouver un dossier précis.",
          "« Nouveau dossier » crée une demande rattachée à un client et à une instance de process (le layout est figé/snapshoté à ce moment).",
          "La fiche détail [id] propose le suivi par stepper séquentiel, les documents, les tâches, l'export PDF et le QR code de suivi ; le visiteur y accède en lecture seule.",
        ],
      },
      {
        title: "Mes dossiers",
        route: "/dashboard/mes-dossiers",
        audience: ["Visiteur"],
        business:
          "Espace personnel du client : il retrouve uniquement ses dossiers, leur statut et peut télécharger ses documents. Lecture seule.",
        technical:
          "Requête Prisma filtrée par l'utilisateur de session (scoping par userId). Aucun droit d'écriture ; téléchargement de documents autorisé.",
        features: ["Dossiers personnels", "Statut en temps réel", "Téléchargement de documents"],
        screenshot: "/docs/mes-dossiers.png",
        screenshotAlt: "Espace personnel du visiteur listant uniquement ses propres dossiers.",
        walkthrough: [
          "Le visiteur connecté ne voit que ses propres dossiers (requête Prisma filtrée par son identifiant de session).",
          "Chaque carte indique le service, le numéro, le statut et la date de dernière mise à jour.",
          "Le bouton « Nouvelle demande » permet d'initier une demande de service.",
          "L'accès est en lecture seule, mais le téléchargement des documents du dossier est autorisé.",
        ],
      },
      {
        title: "Documents",
        route: "/dashboard/documents",
        audience: ["Agent", "Manager", "Administrateur"],
        business:
          "Gestion documentaire centralisée : téléverser, classer et retrouver les pièces liées aux clients et dossiers. Garantit la traçabilité.",
        technical:
          "Upload via Vercel Blob (route app/api/documents/upload) puis enregistrement des métadonnées en base. Lecture des fichiers via app/api/documents/file. Types de documents normalisés (PDF, Word, Excel, images).",
        features: ["Téléversement Blob", "Classement par type", "Lien dossier / client / sous-étape"],
        screenshot: "/docs/documents.png",
        screenshotAlt: "Gestion documentaire centralisée listant les pièces téléversées.",
        walkthrough: [
          "La page centralise toutes les pièces avec leur type normalisé (PDF, Word, Excel, image).",
          "Le téléversement envoie le fichier vers Vercel Blob, puis enregistre ses métadonnées en base.",
          "Chaque document peut être rattaché à un client, un dossier ou une sous-étape de process.",
          "La lecture des fichiers passe par une route dédiée qui contrôle les accès avant de servir le contenu.",
        ],
      },
      {
        title: "Tâches",
        route: "/dashboard/taches",
        audience: ["Agent", "Manager", "Administrateur"],
        business:
          "Organisation du travail : priorités, échéances et statuts pour ne rien oublier sur les dossiers. Améliore la productivité de l'équipe.",
        technical:
          "CRUD tâches via server actions, rattachées à un dossier et à un agent. Énumérations priorité (Basse → Urgente) et statut (À faire → Terminée/Annulée).",
        features: ["Priorités & statuts", "Rattachement dossier/agent", "Suivi d'avancement"],
        screenshot: "/docs/taches.png",
        screenshotAlt: "Liste des tâches avec priorités, échéances et statuts.",
        walkthrough: [
          "Les tâches organisent le travail de l'équipe avec une priorité (Basse à Urgente) et un statut (À faire à Terminée/Annulée).",
          "« Nouvelle tâche » crée une tâche rattachée à un dossier et à un agent responsable.",
          "Les statuts se mettent à jour au fil de l'avancement pour piloter la charge.",
          "Le filtrage par statut ou priorité permet de se concentrer sur les urgences.",
        ],
      },
      {
        title: "Process (layouts)",
        route: "/dashboard/process · /nouveau · /[id]",
        audience: ["Manager", "Administrateur"],
        business:
          "Définition des modèles de processus métier (durée, coût, étapes et sous-étapes). Standardise la production et estime délais et coûts. Verrouillé tant qu'une instance ouverte l'utilise.",
        technical:
          "Modèles Prisma ProcessDefinition / ProcessStep / ProcessSubStep. Éditeur de layout (builder) ; modification bloquée si un dossier non terminé référence le process. À la création d'un dossier, le layout est « snapshoté » dans des tables d'état d'instance.",
        features: ["Éditeur d'étapes/sous-étapes", "Durée & coût estimés", "Verrou si instance ouverte"],
        screenshot: "/docs/process.png",
        screenshotAlt: "Liste des modèles de process métier avec durée et coût estimés.",
        walkthrough: [
          "La page liste les modèles de processus métier réutilisables, avec leur durée et coût estimés.",
          "« Nouveau process » ouvre un éditeur (builder) pour définir les étapes et sous-étapes.",
          "À la création d'un dossier, le layout est « snapshoté » dans des tables d'instance pour préserver l'historique.",
          "La modification d'un modèle est verrouillée tant qu'un dossier non terminé l'utilise, afin de garantir la cohérence.",
        ],
      },
      {
        title: "Analytics & Reporting",
        route: "/dashboard/analytics",
        audience: ["Manager", "Administrateur"],
        business:
          "Pilotage stratégique : KPI, tendances, répartition par statut et par service, chiffre d'affaires et synthèse par catégorie. Aide à la décision.",
        technical:
          "Server actions d'agrégation Prisma avec filtres période + catégorie propagés par l'URL. Graphiques Recharts (aire, secteurs, barres) via composants shadcn/ui. Constantes isolées dans lib/analytics-config.ts.",
        features: ["6 KPI avec tendances", "Graphiques multi-types", "Filtres période/catégorie", "Tableau de synthèse"],
        screenshot: "/docs/analytics.png",
        screenshotAlt: "Tableau analytique avec KPI, courbe d'activité et répartition par statut.",
        walkthrough: [
          "Les filtres période et catégorie (propagés par l'URL) recalculent l'ensemble des indicateurs.",
          "Six cartes KPI affichent les chiffres clés avec leur tendance (dossiers, chiffre d'affaires, taux de complétion, etc.).",
          "Les graphiques Recharts visualisent l'évolution de l'activité, la répartition par statut et le chiffre d'affaires.",
          "Un tableau de synthèse par catégorie de service complète l'analyse pour la prise de décision.",
        ],
      },
      {
        title: "Mon profil",
        route: "/dashboard/profil",
        audience: ["Tous les rôles"],
        business: "Gestion des informations personnelles et des préférences de compte.",
        technical:
          "Lecture/écriture des données utilisateur de session via server actions. Mise à jour sécurisée des champs autorisés.",
        features: ["Informations personnelles", "Sécurité du compte"],
        screenshot: "/docs/profil.png",
        screenshotAlt: "Page de profil utilisateur avec informations personnelles et sécurité.",
        walkthrough: [
          "L'utilisateur consulte et met à jour ses informations personnelles (nom, contact).",
          "Les modifications sont enregistrées via une server action sur les seuls champs autorisés.",
          "La section sécurité permet de gérer le mot de passe du compte.",
          "Cette page est accessible à tous les rôles pour leur propre compte.",
        ],
      },
      {
        title: "Administration des utilisateurs",
        route: "/dashboard/administration",
        audience: ["Administrateur"],
        business:
          "Gouvernance : créer des comptes, attribuer les rôles (Visiteur, Agent, Manager, Admin) et contrôler les accès. Garantit la sécurité organisationnelle.",
        technical:
          "Page réservée au rôle ADMIN (garde via requireRole). Gestion des utilisateurs et rôles via server actions, en s'appuyant sur Better Auth.",
        features: ["Gestion des comptes", "Attribution des rôles", "Contrôle d'accès"],
        screenshot: "/docs/administration.png",
        screenshotAlt: "Page d'administration des utilisateurs réservée aux administrateurs.",
        walkthrough: [
          "La page est réservée au rôle Administrateur (garde requireRole côté serveur).",
          "L'administrateur crée des comptes et leur attribue un rôle : Visiteur, Agent, Manager ou Admin.",
          "La gestion s'appuie sur Better Auth ; un email contenant les identifiants peut être envoyé au nouvel utilisateur.",
          "Le contrôle des rôles conditionne l'accès aux différents modules de l'application.",
        ],
      },
      {
        title: "Coordonnées de l'entreprise",
        route: "/dashboard/parametres",
        audience: ["Administrateur"],
        business:
          "Permet à l'administrateur de modifier les coordonnées de l'agence affichées sur la page publique /contact : téléphone, WhatsApp, email, adresse et horaires. Garantit des informations de contact toujours à jour sans intervention technique.",
        technical:
          "Page réservée au rôle ADMIN (garde requireRole). Lecture/écriture d'une ligne unique de la table CompanySettings via server action (upsert Prisma). La page /contact consomme ces valeurs, l'email de contact servant aussi de destinataire des demandes du formulaire.",
        features: ["Édition téléphone / WhatsApp / email", "Édition adresse & horaires", "Mise à jour temps réel de /contact"],
        screenshot: "/docs/parametres.png",
        screenshotAlt: "Page d'administration des coordonnées de l'entreprise avec formulaire d'édition.",
        walkthrough: [
          "L'administrateur ouvre « Coordonnées » dans la section Administration du menu.",
          "Le formulaire est pré-rempli avec les coordonnées actuelles (téléphone, WhatsApp, email, adresse, horaires).",
          "Après modification, « Enregistrer les modifications » persiste les données via un upsert Prisma.",
          "La page publique /contact reflète immédiatement les nouvelles coordonnées et utilise l'email comme destinataire des messages.",
        ],
      },
      {
        title: "Documentation",
        route: "/dashboard/documentation",
        audience: ["Agent", "Manager", "Administrateur"],
        business:
          "Référentiel d'usage de l'application décrivant chaque page au niveau métier et technique. Sert d'onboarding et de référence. Exports PDF de la documentation et du cahier des charges.",
        technical:
          "Contenu centralisé dans lib/documentation.ts (source unique). Affichage responsive : sections en cartes sur desktop, accordéon sur mobile. Deux routes PDF (pdf-lib) : documentation complète et cahier des charges.",
        features: ["Doc métier + technique", "Accordéon mobile", "Export PDF documentation", "Export PDF cahier des charges"],
        screenshot: "/docs/documentation.png",
        screenshotAlt: "Page de documentation décrivant chaque page au niveau métier et technique.",
        walkthrough: [
          "La documentation décrit chaque page de l'application au niveau métier et technique, captures à l'appui.",
          "Sur desktop, le contenu s'affiche en cartes ; sur mobile, il se replie en accordéon.",
          "Les boutons d'en-tête exportent la documentation complète et le cahier des charges en PDF (pdf-lib).",
          "Tout le contenu provient d'une source unique (lib/documentation.ts), garantissant la cohérence entre l'écran et les PDF.",
        ],
      },
    ],
  },
]

// --- Cahier des charges ------------------------------------------------------

export type CahierGroup = { titre: string; points: string[] }

export const cahierDesCharges: {
  contexte: string
  objectifs: string[]
  perimetre: CahierGroup[]
  exigencesFonctionnelles: CahierGroup[]
  exigencesTechniques: CahierGroup[]
  exigencesNonFonctionnelles: CahierGroup[]
  livrables: string[]
} = {
  contexte:
    "Le projet vise à doter une agence de services (visa, passeport, location de véhicule, assurance voyage, réservation d'hôtel) d'un système intégré de gestion (SIGS) permettant de digitaliser l'ensemble du cycle de vie d'un dossier client, depuis la demande jusqu'à la clôture, avec suivi public et pilotage analytique.",
  objectifs: [
    "Centraliser la gestion des clients, dossiers, documents et tâches.",
    "Standardiser les processus métier via des modèles d'étapes réutilisables.",
    "Offrir un suivi transparent au client (espace personnel + suivi public par QR code).",
    "Sécuriser les accès par une gestion fine des rôles.",
    "Fluidifier la relation client par des notifications email (contact, accusé de réception, bienvenue).",
    "Rendre la configuration de l'agence autonome (coordonnées de contact éditables par l'administrateur).",
    "Fournir un reporting décisionnel et des exports PDF.",
  ],
  perimetre: [
    {
      titre: "Inclus",
      points: [
        "Site public (accueil, services, contact, suivi de dossier).",
        "Authentification et gestion des rôles (Visiteur, Agent, Manager, Admin).",
        "Modules : clients, dossiers, documents, tâches, process, analytics, administration.",
        "Configuration des coordonnées de l'agence par l'administrateur.",
        "Notifications email transactionnelles (contact, accusé de réception, bienvenue).",
        "Génération de documents PDF et de QR codes de suivi.",
      ],
    },
    {
      titre: "Exclus (hors périmètre initial)",
      points: [
        "Paiement en ligne / facturation automatisée.",
        "Application mobile native.",
        "Intégrations tierces avec systèmes d'ambassades.",
      ],
    },
  ],
  exigencesFonctionnelles: [
    {
      titre: "Gestion des dossiers",
      points: [
        "Créer un dossier rattaché à un client et à une instance de process.",
        "Suivre l'avancement via un stepper séquentiel à étapes et sous-étapes.",
        "Valider une étape uniquement lorsque toutes ses cases sont cochées.",
        "Clôturer automatiquement le dossier à la dernière étape (statut Terminé).",
        "Exporter la fiche dossier en PDF et générer un QR code de suivi.",
      ],
    },
    {
      titre: "Gestion documentaire",
      points: [
        "Téléverser des documents (PDF, Word, Excel, images) et les classer.",
        "Rattacher les documents à un client, un dossier ou une sous-étape.",
        "Permettre le téléchargement (y compris en lecture seule pour le visiteur).",
      ],
    },
    {
      titre: "Process & pilotage",
      points: [
        "Définir des modèles de process (durée, coût, étapes, sous-étapes).",
        "Empêcher la modification d'un layout utilisé par une instance ouverte.",
        "Visualiser KPI, tendances et répartitions avec filtres période/catégorie.",
      ],
    },
    {
      titre: "Suivi client & rôles",
      points: [
        "Espace personnel client en lecture seule avec téléchargement de documents.",
        "Suivi public par numéro de dossier et par QR code.",
        "Administration des comptes et attribution des rôles.",
      ],
    },
    {
      titre: "Communication & configuration",
      points: [
        "Formulaire de contact avec champs nom, email et sujet obligatoires, téléphone facultatif.",
        "À l'envoi : notification à l'email de l'agence (avec replyTo) et accusé de réception au visiteur.",
        "Email de bienvenue automatique à la création d'un compte via l'inscription publique.",
        "Coordonnées de l'agence (téléphone, WhatsApp, email, adresse, horaires) éditables par l'administrateur.",
        "Affichage/masquage du mot de passe (icône œil) sur les écrans de connexion et d'inscription.",
      ],
    },
  ],
  exigencesTechniques: [
    {
      titre: "Architecture",
      points: [
        "Application Next.js 16 (App Router, React Server Components).",
        "Logique serveur via Server Actions et Route Handlers.",
        "Architecture modulaire orientée fonctionnalités, facilement extensible.",
      ],
    },
    {
      titre: "Données & persistance",
      points: [
        "Base PostgreSQL gérée via Neon, accès par l'ORM Prisma.",
        "Schéma : User, Client, Dossier, Document, Tache, ProcessDefinition/Step/SubStep, Avis, CompanySettings et tables d'état d'instance.",
        "Snapshot des layouts de process dans les instances pour préserver l'historique.",
      ],
    },
    {
      titre: "Sécurité",
      points: [
        "Authentification Better Auth (email + mot de passe, sessions sécurisées).",
        "Contrôle d'accès basé sur les rôles (garde requireRole / requireUser).",
        "Scoping des requêtes par userId pour les données du visiteur.",
        "Requêtes paramétrées (Prisma) contre l'injection SQL.",
      ],
    },
    {
      titre: "Services & rendu",
      points: [
        "Stockage de fichiers via Vercel Blob.",
        "Envoi d'emails transactionnels via Resend (contact, accusé de réception, bienvenue).",
        "Génération PDF côté serveur via pdf-lib.",
        "Visualisations via Recharts ; UI via shadcn/ui et Tailwind CSS v4.",
      ],
    },
  ],
  exigencesNonFonctionnelles: [
    {
      titre: "Qualité de service",
      points: [
        "Interface responsive mobile-first (accordéon sur mobile).",
        "Accessibilité : HTML sémantique, rôles ARIA, contrastes respectés.",
        "Performance : rendu serveur, agrégations optimisées.",
        "Maintenabilité : composants découplés, source de contenu unique.",
      ],
    },
  ],
  livrables: [
    "Application web déployée (espaces public et authentifié).",
    "Base de données structurée et migrée.",
    "Documentation d'usage métier et technique (cette page).",
    "Cahier des charges et description technique exportables en PDF.",
  ],
}
