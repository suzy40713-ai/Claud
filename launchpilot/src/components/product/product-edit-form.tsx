"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProduct } from "@/lib/actions/products";
import type { Tables } from "@/types/database";

export function ProductEditForm({ product }: { product: Tables<"products"> }) {
  const [form, setForm] = React.useState({
    name: product.name,
    description: product.description,
    category: product.category,
    url: product.url || "",
    target_customer: product.target_customer || "",
    main_problem: product.main_problem || "",
    price: product.price?.toString() || "",
  });
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateProduct({
      productId: product.id,
      ...form,
      price: form.price ? Number(form.price) : undefined,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Produit mis à jour.");
    } else {
      toast.error(result.error || "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du produit</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url">URL du produit</Label>
          <Input id="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Prix (€)</Label>
          <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_customer">Client cible</Label>
        <Input
          id="target_customer"
          value={form.target_customer}
          onChange={(e) => setForm({ ...form, target_customer: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="main_problem">Problème principal résolu</Label>
        <Textarea
          id="main_problem"
          rows={3}
          value={form.main_problem}
          onChange={(e) => setForm({ ...form, main_problem: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Enregistrer
      </Button>
    </form>
  );
}
