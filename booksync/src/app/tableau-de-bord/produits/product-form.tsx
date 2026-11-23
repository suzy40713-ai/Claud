"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES, type ProductInput } from "@/domain/marketing/product";
import { createProductAction, updateProductAction } from "./actions";

type Initial = {
  name: string;
  description: string;
  price: string;
  category: string;
  benefits: string;
  targetAudience: string;
  url: string;
};

export function ProductForm({
  productId,
  initial,
  submitLabel,
}: {
  productId?: string;
  initial?: Initial;
  submitLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const input = {
      name: f.name ?? "",
      description: f.description ?? "",
      price: f.price ?? "",
      category: f.category ?? "",
      benefits: f.benefits ?? "",
      targetAudience: f.targetAudience ?? "",
      url: f.url ?? "",
    } as ProductInput;
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const res = productId
        ? await updateProductAction(productId, input)
        : await createProductAction(input);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors || !Object.keys(res.fieldErrors).length) setFormError(res.error);
        else toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Enregistré.");
      router.push(`/tableau-de-bord/produits/${res.data.id}` as Route);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" data-testid="product-form">
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field id="name" label="Nom du produit ou du service" error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="Bougies parfumées Lumi"
          required
        />
      </Field>
      <Field
        id="description"
        label="Description"
        hint="Ce que c'est, comment ça marche, ce qui le rend différent. Plus c'est précis, meilleure sera l'analyse."
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial?.description}
          required
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="price"
          label="Prix (€ TTC)"
          hint="Laissez vide si le prix varie."
          error={errors.price}
        >
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="24,90"
            defaultValue={initial?.price}
          />
        </Field>
        <Field id="category" label="Catégorie" error={errors.category}>
          <NativeSelect
            id="category"
            name="category"
            defaultValue={initial?.category ?? ""}
            required
          >
            <option value="" disabled>
              Choisissez
            </option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field
        id="benefits"
        label="Avantages (facultatif)"
        hint="Un avantage par ligne : ce que le client y gagne."
        error={errors.benefits}
      >
        <Textarea id="benefits" name="benefits" rows={3} defaultValue={initial?.benefits} />
      </Field>
      <Field
        id="targetAudience"
        label="Public cible (facultatif)"
        hint="Qui l'achète aujourd'hui ou à qui vous pensez le vendre."
        error={errors.targetAudience}
      >
        <Input id="targetAudience" name="targetAudience" defaultValue={initial?.targetAudience} />
      </Field>
      <Field
        id="url"
        label="Lien vers le produit (facultatif)"
        hint="Boutique, page de vente, Instagram…"
        error={errors.url}
      >
        <Input
          id="url"
          name="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://"
          defaultValue={initial?.url}
        />
      </Field>
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Spinner /> : null} {submitLabel}
        </Button>
      </div>
    </form>
  );
}
