"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createProduct } from "@/lib/actions/products";

import {
  emptyOnboardingForm,
  OBJECTIVE_OPTIONS,
  SOCIAL_NETWORKS,
  type OnboardingFormState,
} from "./types";

const STEPS = [
  "Ton produit",
  "Ton client",
  "Ton business",
  "Tes ressources",
  "Ton objectif",
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<OnboardingFormState>(emptyOnboardingForm);
  const [submitting, setSubmitting] = React.useState(false);

  const update = <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.description.trim().length > 0 && form.category.trim().length > 0;
      case 4:
        return form.objective !== "";
      default:
        return true;
    }
  }, [step, form]);

  const isLast = step === STEPS.length - 1;

  async function handleSubmit() {
    if (!form.objective) return;
    setSubmitting(true);
    const result = await createProduct({
      name: form.name,
      description: form.description,
      category: form.category,
      url: form.url || undefined,
      target_customer: form.target_customer || undefined,
      target_age: form.target_age || undefined,
      target_market: form.target_market || undefined,
      main_problem: form.main_problem || undefined,
      price: form.price ? Number(form.price) : undefined,
      business_model: form.business_model || undefined,
      sales_platform: form.sales_platform || undefined,
      margin: form.margin ? Number(form.margin) : undefined,
      monthly_goal: form.monthly_goal || undefined,
      marketing_budget: form.marketing_budget || undefined,
      weekly_time_hours: form.weekly_time_hours ? Number(form.weekly_time_hours) : undefined,
      social_networks: form.social_networks,
      existing_audience: form.existing_audience || undefined,
      objective: form.objective,
    });

    setSubmitting(false);

    if (!result.success || !result.productId) {
      toast.error(result.error || "Une erreur est survenue.");
      return;
    }

    router.push(`/generating?productId=${result.productId}`);
  }

  function toggleSocial(network: string) {
    setForm((f) => ({
      ...f,
      social_networks: f.social_networks.includes(network)
        ? f.social_networks.filter((n) => n !== network)
        : [...f.social_networks, network],
    }));
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Étape {step + 1} sur {STEPS.length} · {STEPS[step]}
          </span>
          <span className="text-muted-foreground">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card className="animate-in-fade">
        <CardContent className="space-y-6 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <StepHeader title="Quel est ton produit ?" description="Les bases pour qu'on comprenne ce que tu vends." />
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex : Focusly" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="En 2-3 phrases, qu'est-ce que ton produit fait et pour qui ?"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Ex : SaaS productivité, cosmétique bio, coaching..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL du produit (facultatif)</Label>
                <Input id="url" value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeader title="Qui veux-tu aider ?" description="Décris ton client idéal, même approximativement." />
              <div className="space-y-2">
                <Label htmlFor="target_customer">Client cible</Label>
                <Input
                  id="target_customer"
                  value={form.target_customer}
                  onChange={(e) => update("target_customer", e.target.value)}
                  placeholder="Ex : freelances qui manquent de temps"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target_age">Âge approximatif</Label>
                  <Input id="target_age" value={form.target_age} onChange={(e) => update("target_age", e.target.value)} placeholder="Ex : 25-40 ans" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_market">Pays / marché</Label>
                  <Input id="target_market" value={form.target_market} onChange={(e) => update("target_market", e.target.value)} placeholder="Ex : France, Europe..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_problem">Problème principal résolu</Label>
                <Textarea
                  id="main_problem"
                  value={form.main_problem}
                  onChange={(e) => update("main_problem", e.target.value)}
                  placeholder="Quel problème concret ton client rencontre-t-il ?"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepHeader title="Ton business" description="Comment ton produit génère (ou générera) des revenus." />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input id="price" type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="Ex : 29" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin">Marge approximative (%, facultatif)</Label>
                  <Input id="margin" type="number" min="0" max="100" value={form.margin} onChange={(e) => update("margin", e.target.value)} placeholder="Ex : 70" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_model">Modèle économique</Label>
                <Select value={form.business_model} onValueChange={(v) => update("business_model", v)}>
                  <SelectTrigger id="business_model">
                    <SelectValue placeholder="Choisis un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abonnement">Abonnement</SelectItem>
                    <SelectItem value="paiement_unique">Paiement unique</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="service">Service / prestation</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_platform">Plateforme de vente</Label>
                <Input
                  id="sales_platform"
                  value={form.sales_platform}
                  onChange={(e) => update("sales_platform", e.target.value)}
                  placeholder="Ex : Shopify, site perso, App Store, Gumroad..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_goal">Objectif mensuel</Label>
                <Input
                  id="monthly_goal"
                  value={form.monthly_goal}
                  onChange={(e) => update("monthly_goal", e.target.value)}
                  placeholder="Ex : 10 ventes, 1000€ de CA..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <StepHeader title="Tes ressources" description="Pour un plan réaliste, adapté à ce que tu as vraiment." />
              <div className="space-y-2">
                <Label htmlFor="marketing_budget">Budget marketing</Label>
                <Select value={form.marketing_budget} onValueChange={(v) => update("marketing_budget", v)}>
                  <SelectTrigger id="marketing_budget">
                    <SelectValue placeholder="Choisis une fourchette" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0€">0€ (gratuit uniquement)</SelectItem>
                    <SelectItem value="<100€/mois">Moins de 100€/mois</SelectItem>
                    <SelectItem value="100-500€/mois">100 à 500€/mois</SelectItem>
                    <SelectItem value="500€+/mois">Plus de 500€/mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly_time_hours">Temps disponible par semaine (heures)</Label>
                <Input
                  id="weekly_time_hours"
                  type="number"
                  min="0"
                  value={form.weekly_time_hours}
                  onChange={(e) => update("weekly_time_hours", e.target.value)}
                  placeholder="Ex : 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Réseaux sociaux utilisés</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SOCIAL_NETWORKS.map((network) => (
                    <label key={network} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.social_networks.includes(network)}
                        onCheckedChange={() => toggleSocial(network)}
                      />
                      {network}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="existing_audience">Audience existante</Label>
                <Input
                  id="existing_audience"
                  value={form.existing_audience}
                  onChange={(e) => update("existing_audience", e.target.value)}
                  placeholder="Ex : 500 abonnés Instagram, liste email de 200 personnes, aucune..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <StepHeader title="Ton objectif principal" description="Ça oriente tout le plan qu'on va te générer." />
              <RadioGroup
                value={form.objective}
                onValueChange={(v) => update("objective", v as OnboardingFormState["objective"])}
                className="gap-3"
              >
                {OBJECTIVE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                      form.objective === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                    )}
                  >
                    <RadioGroupItem value={opt.value} className="mt-1" />
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {isLast ? (
          <Button variant="brand" size="lg" onClick={handleSubmit} disabled={!canProceed || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Générer mon plan
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canProceed}>
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
