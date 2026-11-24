"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TOOLS, type ToolKind } from "@/domain/marketing/tools";
import { defaultOptionValues, type ToolOptionValues } from "@/domain/marketing/tools/options";
import { runToolAction } from "@/app/tableau-de-bord/marketing-actions";

export function ToolForm({
  kind,
  products,
  defaultProductId,
  submitLabel,
}: {
  kind: ToolKind;
  products: Array<{ id: string; name: string }>;
  defaultProductId?: string;
  submitLabel: string;
}) {
  const tool = TOOLS[kind];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? "");
  const [values, setValues] = useState<ToolOptionValues>(() => defaultOptionValues(tool.options));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; limit: boolean } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setError(null);
    startTransition(async () => {
      const res = await runToolAction(kind, productId, values);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError({ text: res.error, limit: Boolean(res.limit) });
        return;
      }
      toast.success("C'est prêt.");
      router.push(`${tool.section}/${res.data.id}` as Route);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
      data-testid="tool-form"
    >
      {error ? (
        <Alert variant="error">
          {error.text}{" "}
          {error.limit ? (
            <Link href="/tableau-de-bord/abonnement" className="font-medium underline">
              Voir les forfaits
            </Link>
          ) : null}
        </Alert>
      ) : null}
      <Field id="tool-product" label="Produit" error={errors.productId}>
        <NativeSelect
          id="tool-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {tool.options.map((o) => {
        const id = `tool-${o.name}`;
        if (o.type === "select")
          return (
            <Field key={o.name} id={id} label={o.label} error={errors[o.name]}>
              <NativeSelect
                id={id}
                value={values[o.name] as string}
                onChange={(e) => setValues({ ...values, [o.name]: e.target.value })}
              >
                {o.choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          );
        if (o.type === "multi") {
          const picked = values[o.name] as string[];
          return (
            <fieldset key={o.name} className="grid gap-2">
              <legend className="text-sm font-medium">{o.label}</legend>
              {o.hint ? <p className="text-sm text-muted-foreground">{o.hint}</p> : null}
              <div className="mt-1 flex flex-wrap gap-2">
                {o.choices.map((c) => {
                  const on = picked.includes(c.value);
                  return (
                    <button
                      type="button"
                      key={c.value}
                      aria-pressed={on}
                      disabled={!on && picked.length >= o.max}
                      onClick={() =>
                        setValues({
                          ...values,
                          [o.name]: on ? picked.filter((v) => v !== c.value) : [...picked, c.value],
                        })
                      }
                      className="rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground"
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {errors[o.name] ? (
                <p className="text-sm text-destructive">{errors[o.name]}</p>
              ) : null}
            </fieldset>
          );
        }
        return (
          <Field key={o.name} id={id} label={o.label} hint={o.hint} error={errors[o.name]}>
            <Textarea
              id={id}
              rows={5}
              maxLength={o.maxLength}
              placeholder={o.placeholder}
              value={values[o.name] as string}
              onChange={(e) => setValues({ ...values, [o.name]: e.target.value })}
            />
          </Field>
        );
      })}
      <div>
        <Button type="submit" disabled={pending || !productId} data-testid="tool-submit">
          <Sparkles /> {pending ? "Préparation…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
