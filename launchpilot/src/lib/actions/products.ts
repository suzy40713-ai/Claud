"use server";

import { createClient } from "@/lib/supabase/server";
import type { Objective } from "@/types/database";

export interface OnboardingInput {
  name: string;
  description: string;
  category: string;
  url?: string;
  target_customer?: string;
  target_age?: string;
  target_market?: string;
  main_problem?: string;
  price?: number;
  business_model?: string;
  sales_platform?: string;
  margin?: number;
  monthly_goal?: string;
  marketing_budget?: string;
  weekly_time_hours?: number;
  social_networks: string[];
  existing_audience?: string;
  objective: Objective;
}

export interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export async function createProduct(input: OnboardingInput): Promise<CreateProductResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  if (!input.name.trim() || !input.description.trim() || !input.category.trim()) {
    return { success: false, error: "Merci de compléter les informations sur ton produit." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      url: input.url?.trim() || null,
      target_customer: input.target_customer?.trim() || null,
      target_age: input.target_age?.trim() || null,
      target_market: input.target_market?.trim() || null,
      main_problem: input.main_problem?.trim() || null,
      price: input.price ?? null,
      business_model: input.business_model || null,
      sales_platform: input.sales_platform?.trim() || null,
      margin: input.margin ?? null,
      monthly_goal: input.monthly_goal?.trim() || null,
      marketing_budget: input.marketing_budget || null,
      weekly_time_hours: input.weekly_time_hours ?? null,
      social_networks: input.social_networks,
      existing_audience: input.existing_audience?.trim() || null,
      objective: input.objective,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Impossible d'enregistrer ton produit. Réessaie." };
  }

  return { success: true, productId: data.id };
}

export interface UpdateProductInput {
  productId: string;
  name: string;
  description: string;
  category: string;
  url?: string;
  target_customer?: string;
  main_problem?: string;
  price?: number;
}

export async function updateProduct(input: UpdateProductInput): Promise<CreateProductResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      url: input.url?.trim() || null,
      target_customer: input.target_customer?.trim() || null,
      main_problem: input.main_problem?.trim() || null,
      price: input.price ?? null,
    })
    .eq("id", input.productId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Impossible de mettre à jour ton produit." };
  }

  return { success: true, productId: input.productId };
}
