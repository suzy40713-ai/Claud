"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RESULT_CHANNELS, type ResultInput } from "@/domain/marketing/results";
import { addResultAction, deleteResultAction } from "./actions";

export function ResultForm({
  today,
  products,
}: {
  today: string;
  products: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = Object.fromEntries(new FormData(e.currentTarget)) as unknown as ResultInput;
    setErrors({});
    startTransition(async () => {
      const res = await addResultAction(input);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Résultat enregistré.");
      form.current?.reset();
      router.refresh();
    });
  }

  const num = (name: string, label: string, hint?: string, money = false) => (
    <Field id={`r-${name}`} label={label} hint={hint} error={errors[name]}>
      <Input
        id={`r-${name}`}
        name={name}
        inputMode={money ? "decimal" : "numeric"}
        placeholder={money ? "0,00" : ""}
      />
    </Field>
  );

  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:grid-cols-2 sm:p-6"
      data-testid="result-form"
    >
      <Field id="r-date" label="Date" error={errors.date}>
        <Input id="r-date" name="date" type="date" defaultValue={today} max={today} required />
      </Field>
      <Field id="r-channel" label="Canal" error={errors.channel}>
        <NativeSelect id="r-channel" name="channel" defaultValue="tiktok">
          {RESULT_CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {products.length ? (
        <Field id="r-product" label="Produit (facultatif)" error={errors.productId}>
          <NativeSelect id="r-product" name="productId" defaultValue="">
            <option value="">Tous / non précisé</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {num("spend", "Dépense publicitaire (€)", "0 si c'était gratuit", true)}
      {num("impressions", "Vues", "Facultatif")}
      {num("clicks", "Clics", "Facultatif")}
      {num("sales", "Ventes", "Facultatif")}
      {num("revenue", "Chiffre d'affaires (€)", "Facultatif", true)}
      <Field id="r-note" label="Note (facultatif)" error={errors.note} className="sm:col-span-2">
        <Input id="r-note" name="note" maxLength={300} placeholder="Vidéo coulée de bougie" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer ce résultat"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteResultButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Supprimer cette ligne"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteResultAction(id);
          if (!res.ok) return void toast.error(res.error);
          router.refresh();
        })
      }
    >
      <Trash2 />
    </Button>
  );
}
