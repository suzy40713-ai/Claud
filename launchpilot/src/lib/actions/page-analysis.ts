"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { fetchPublicPage } from "@/lib/fetch-public-page";
import { analyzeProductPage, PageAnalysisError } from "@/lib/ai/analyze-page";

export interface PageAnalysisResult {
  success: boolean;
  error?: string;
}

export async function analyzeProductUrl(productId: string): Promise<PageAnalysisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", user.id)
    .single();

  if (!product) {
    return { success: false, error: "Produit introuvable." };
  }
  if (!product.url) {
    return { success: false, error: "Ajoute d'abord une URL à ton produit." };
  }

  const page = await fetchPublicPage(product.url);

  if (page.status !== "ok") {
    await supabase.from("product_page_analyses").insert({
      user_id: user.id,
      product_id: product.id,
      url: product.url,
      fetch_status: page.status,
      page_title: page.title,
      meta_description: page.metaDescription,
      findings: {},
      improvements: [],
    });
    revalidatePath("/dashboard/produit");
    return { success: false, error: page.error || "Impossible d'accéder à cette page publiquement." };
  }

  try {
    const analysis = await analyzeProductPage(product, page);

    await supabase.from("product_page_analyses").insert({
      user_id: user.id,
      product_id: product.id,
      url: product.url,
      fetch_status: "ok",
      page_title: page.title,
      meta_description: page.metaDescription,
      findings: analysis.findings,
      improvements: analysis.improvements,
    });

    revalidatePath("/dashboard/produit");
    return { success: true };
  } catch (error) {
    const message = error instanceof PageAnalysisError ? error.message : "L'analyse a échoué.";
    return { success: false, error: message };
  }
}
