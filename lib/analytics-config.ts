export const ANALYTICS_PERIODS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "3 derniers mois" },
  { value: "12m", label: "12 derniers mois" },
  { value: "all", label: "Tout l'historique" },
] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]["value"]
