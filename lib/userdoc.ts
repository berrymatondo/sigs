// Single source of truth for the client-facing user guide (/userdoc), shared
// by the on-screen page and its PDF export.

export type UserDocSection = {
  id: string
  // Lucide icon name, resolved to a component by the caller (page or PDF
  // route) — kept as a string here so this file has no React/PDF dependency.
  icon: string
  title: string
  intro: string
  tips: string[]
  screenshot?: string
  screenshotAlt?: string
}

export const USERDOC_TITLE = "Guide d'utilisation"
export const USERDOC_INTRO =
  "Ce guide explique, rubrique par rubrique, comment fonctionne votre espace personnel SIGS : où suivre vos dossiers, comment échanger avec votre agent, et comment ne rien manquer grâce aux notifications."

export const userDocSections: UserDocSection[] = [
  {
    id: "tableau-de-bord",
    icon: "LayoutDashboard",
    title: "Tableau de bord",
    intro:
      "C'est la première page que vous voyez après connexion. Elle vous donne un aperçu rapide de votre activité : combien de dossiers vous avez, combien sont en cours, combien sont terminés, et le nombre de documents que vous avez déposés.",
    tips: [
      "Les cartes en haut de page résument vos chiffres clés en un coup d'œil.",
      "La section « Dossiers récents » liste vos dernières demandes avec leur statut et leur avancement — cliquez sur une carte pour l'ouvrir directement.",
      "Le petit indicateur en pastilles sous chaque dossier montre à quelle étape il en est dans son traitement.",
    ],
    screenshot: "/userdoc/dashboard.png",
    screenshotAlt: "Tableau de bord du client avec les statistiques et les dossiers récents.",
  },
  {
    id: "mes-dossiers",
    icon: "FolderOpen",
    title: "Mes dossiers",
    intro:
      "Cette page liste toutes vos demandes de services (visa, location de voiture, assurance, hôtel, passeport...). C'est ici que vous suivez l'avancement de chaque dossier et que vous en créez de nouveaux.",
    tips: [
      "Chaque dossier affiche son type, son statut actuel et, s'il suit un processus défini, une jauge d'étapes qui se remplit au fur et à mesure du traitement.",
      "Cliquez sur « Nouvelle demande » en haut à droite pour soumettre une nouvelle demande de service.",
      "Cliquez sur un dossier pour en voir tous les détails.",
    ],
    screenshot: "/userdoc/mes-dossiers.png",
    screenshotAlt: "Liste des dossiers du client avec statuts et jauges de progression.",
  },
  {
    id: "detail-dossier",
    icon: "Workflow",
    title: "Le détail d'un dossier",
    intro:
      "En ouvrant un dossier, vous retrouvez toutes les informations le concernant : le client, le montant, la date de création, l'agent qui s'en occupe, le statut actuel et l'historique des changements de statut.",
    tips: [
      "Un QR code de suivi est généré automatiquement pour chaque dossier : il permet de retrouver rapidement son état, même sans être connecté.",
      "L'historique des statuts (en bas de la fiche) retrace chronologiquement toutes les étapes déjà franchies par votre dossier.",
      "La messagerie et les onglets Process/Documents donnent accès au suivi détaillé (voir les rubriques suivantes).",
    ],
    screenshot: "/userdoc/dossier-detail.png",
    screenshotAlt: "Fiche détaillée d'un dossier avec informations, statut et QR code de suivi.",
  },
  {
    id: "suivi-process",
    icon: "QrCode",
    title: "Suivi du process",
    intro:
      "Quand votre dossier suit un processus défini (par exemple les différentes étapes d'une demande de visa), l'onglet « Suivi du process » vous montre exactement où il en est : quelles étapes sont validées, laquelle est en cours, et lesquelles restent à venir.",
    tips: [
      "Chaque étape peut comporter des sous-étapes avec, parfois, des documents requis à fournir.",
      "L'étape surlignée en couleur est celle en cours de traitement par votre agent ; les étapes déjà validées apparaissent cochées en vert.",
      "Vous n'avez rien à faire manuellement ici : c'est votre agent qui fait progresser le dossier, vous n'êtes que spectateur de l'avancement.",
    ],
    screenshot: "/userdoc/dossier-process.png",
    screenshotAlt: "Onglet de suivi du process d'un dossier avec les étapes validées, en cours et à venir.",
  },
  {
    id: "documents",
    icon: "FileText",
    title: "Documents",
    intro:
      "L'onglet « Documents » regroupe tous les fichiers liés à votre dossier : ceux que vous avez déposés et ceux ajoutés par votre agent (justificatifs, confirmations, etc.).",
    tips: [
      "Vous pouvez ajouter un document depuis cet onglet ou directement depuis votre profil pour vos pièces personnelles (carte d'identité, passeport...).",
      "Chaque document peut être téléchargé en un clic depuis l'icône de téléchargement.",
      "Vous ne pouvez supprimer que les documents que vous avez vous-même déposés.",
    ],
    screenshot: "/userdoc/mes-dossiers.png",
    screenshotAlt: "Liste des documents attachés à un dossier.",
  },
  {
    id: "messages",
    icon: "MessageSquare",
    title: "Discuter avec votre agent",
    intro:
      "La messagerie, affichée bien en évidence en haut de chaque dossier, est un fil de discussion privé directement lié à votre demande : vous pouvez y échanger avec l'agent qui la traite, poser une question ou obtenir une précision, sans avoir à téléphoner ou envoyer un email.",
    tips: [
      "Tapez votre message dans le champ en bas et appuyez sur Entrée (ou cliquez sur l'icône d'envoi) pour l'envoyer.",
      "La conversation se met à jour automatiquement toutes les quelques secondes : pas besoin de rafraîchir la page pour voir une réponse.",
      "Sur la liste de vos dossiers, un badge « nouveau message » bien visible apparaît dès qu'une réponse arrive.",
      "Quand votre agent vous répond, vous recevez aussi une notification (voir ci-dessous) et, si votre numéro est enregistré, un message WhatsApp.",
    ],
    screenshot: "/userdoc/dossier-messages.png",
    screenshotAlt: "Messagerie d'un dossier avec les échanges entre le client et l'agent.",
  },
  {
    id: "notifications",
    icon: "Bell",
    title: "Notifications",
    intro:
      "La cloche visible en haut de chaque page de votre espace vous prévient en temps réel dès qu'il se passe quelque chose vous concernant — typiquement, une réponse de votre agent dans un dossier.",
    tips: [
      "Un badge rouge sur la cloche indique le nombre de notifications non lues.",
      "Cliquez sur la cloche pour voir la liste, puis sur une notification pour être amené directement au bon dossier.",
      "Le bouton « Tout marquer comme lu » permet de vider les notifications en attente en une fois.",
    ],
    screenshot: "/userdoc/notifications.png",
    screenshotAlt: "Panneau de notifications ouvert depuis la cloche, avec un message non lu.",
  },
  {
    id: "profil",
    icon: "UserCircle",
    title: "Mon profil",
    intro:
      "Depuis « Mon profil », vous gérez vos informations personnelles (nom, téléphone) et vos documents personnels, indépendamment de vos dossiers.",
    tips: [
      "Gardez vos coordonnées à jour : c'est ce numéro qui reçoit les notifications WhatsApp de vos dossiers.",
      "Vous pouvez y déposer des documents personnels (pièce d'identité, passeport) réutilisables pour vos futures demandes.",
    ],
    screenshot: "/userdoc/profil.png",
    screenshotAlt: "Page de profil du client avec ses informations personnelles.",
  },
  {
    id: "theme",
    icon: "Moon",
    title: "Thème clair / sombre",
    intro:
      "Le bouton en forme de soleil/lune, visible en haut de vos pages et dans le pied de la barre latérale, vous permet de choisir l'apparence de l'application : claire, sombre, ou automatique selon les préférences de votre appareil.",
    tips: [],
  },
  {
    id: "aide",
    icon: "HelpCircle",
    title: "Besoin d'aide ?",
    intro:
      "Le moyen le plus rapide reste la messagerie de votre dossier (rubrique « Discuter avec votre agent ») : votre agent y est notifié immédiatement. Vous pouvez aussi nous contacter via la page Contact du site (/contact).",
    tips: [],
  },
]
