import { z } from "zod";

export const subscoreSchema = z.object({
  axis: z.enum(["positioning", "offer", "acquisition", "content", "conversion", "social_proof"]),
  label: z.string(),
  score: z.number().min(0).max(100),
  problem: z.string(),
  recommendation: z.string(),
  priority: z.enum(["haute", "moyenne", "basse"]),
});

export const personaSchema = z.object({
  profile_summary: z.string(),
  main_problem: z.string(),
  goals: z.array(z.string()).min(1),
  frustrations: z.array(z.string()).min(1),
  motivations: z.array(z.string()).min(1),
  objections: z.array(z.string()).min(1),
  where_to_find: z.array(z.string()).min(1),
  content_consumed: z.array(z.string()).min(1),
});

export const positioningSchema = z.object({
  value_proposition: z.string(),
  problem: z.string(),
  solution: z.string(),
  differentiation: z.string(),
  main_benefit: z.string(),
  elevator_pitch: z.string(),
  selling_points: z.array(z.string()).min(5).max(10),
});

export const offerSchema = z.object({
  main_offer: z.string(),
  bonuses: z.array(z.string()),
  guarantee: z.string().nullable(),
  urgency: z.string().nullable(),
  cta: z.string(),
  objections: z.array(z.object({ objection: z.string(), response: z.string() })),
});

export const acquisitionStrategySchema = z.object({
  budget_tier: z.enum(["free", "small_budget"]),
  channel: z.string(),
  description: z.string(),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  cost: z.string(),
  time_required: z.string(),
  potential: z.enum(["faible", "moyen", "eleve"]),
  first_action: z.string(),
});

export const contentIdeaSchema = z.object({
  platform: z.string(),
  format: z.string(),
  hook: z.string(),
  subject: z.string(),
  script: z.string(),
  cta: z.string(),
  objective: z.string(),
});

export const calendarDaySchema = z.object({
  day_number: z.number().min(1).max(30),
  objective: z.string(),
  task: z.string(),
  duration_minutes: z.number().min(5).max(480),
  platform: z.string(),
  expected_result: z.string(),
});

export const firstCustomerActionsSchema = z.object({
  today: z.array(z.string()).min(3),
  week: z.array(z.string()).min(5),
  month: z.array(z.string()).min(4),
});

export const emailSchema = z.object({
  email_type: z.enum(["launch", "intro", "follow_up", "recovery", "loyalty"]),
  subject: z.string(),
  body: z.string(),
});

export const adSchema = z.object({
  platform: z.string(),
  angle: z.string(),
  hook: z.string(),
  primary_text: z.string(),
  headline: z.string(),
  cta: z.string(),
  target_audience: z.string(),
});

export const generationOutputSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  subscores: z.array(subscoreSchema).length(6),
  persona: personaSchema,
  positioning: positioningSchema,
  offer: offerSchema,
  acquisition_strategies: z.array(acquisitionStrategySchema).min(6),
  content_ideas: z.array(contentIdeaSchema).length(30),
  calendar: z.array(calendarDaySchema).length(30),
  first_customer_actions: firstCustomerActionsSchema,
  emails: z.array(emailSchema).length(5),
  ads: z.array(adSchema).length(5),
});

export type GenerationOutput = z.infer<typeof generationOutputSchema>;
export type Subscore = z.infer<typeof subscoreSchema>;

export const pageAnalysisOutputSchema = z.object({
  findings: z.object({
    value_proposition_clarity: z.string(),
    cta_clarity: z.string(),
    structure: z.string(),
    trust_signals: z.string(),
    objections_handling: z.string(),
    conversion_friction: z.string(),
  }),
  improvements: z.array(z.string()).length(10),
});

export type PageAnalysisOutput = z.infer<typeof pageAnalysisOutputSchema>;
