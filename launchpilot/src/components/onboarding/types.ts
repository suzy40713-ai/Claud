import type { Objective } from "@/types/database";

export interface OnboardingFormState {
  name: string;
  description: string;
  category: string;
  url: string;

  target_customer: string;
  target_age: string;
  target_market: string;
  main_problem: string;

  price: string;
  business_model: string;
  sales_platform: string;
  margin: string;
  monthly_goal: string;

  marketing_budget: string;
  weekly_time_hours: string;
  social_networks: string[];
  existing_audience: string;

  objective: Objective | "";
}

export const emptyOnboardingForm: OnboardingFormState = {
  name: "",
  description: "",
  category: "",
  url: "",
  target_customer: "",
  target_age: "",
  target_market: "",
  main_problem: "",
  price: "",
  business_model: "",
  sales_platform: "",
  margin: "",
  monthly_goal: "",
  marketing_budget: "",
  weekly_time_hours: "",
  social_networks: [],
  existing_audience: "",
  objective: "",
};

export const SOCIAL_NETWORKS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "X / Twitter",
  "Facebook",
  "Pinterest",
  "Reddit",
];

export const OBJECTIVE_OPTIONS: { value: Objective; label: string; description: string }[] = [
  {
    value: "first_customers",
    label: "Obtenir mes premiers clients",
    description: "Je n'ai pas encore de clients payants.",
  },
  {
    value: "increase_sales",
    label: "Augmenter mes ventes",
    description: "J'ai déjà des clients, je veux vendre plus.",
  },
  {
    value: "launch_product",
    label: "Lancer mon produit",
    description: "Le lancement officiel approche.",
  },
  {
    value: "grow_audience",
    label: "Développer mon audience",
    description: "Je veux construire une communauté avant de vendre.",
  },
  {
    value: "find_positioning",
    label: "Trouver mon positionnement",
    description: "Je ne sais pas encore comment présenter mon produit.",
  },
];
