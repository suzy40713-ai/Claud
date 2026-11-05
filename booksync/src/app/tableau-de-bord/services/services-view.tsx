"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, EyeOff, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/settings/image-upload";
import { formatCents, formatDuration } from "@/lib/format";
import { deleteServiceAction, saveServiceAction, setServiceImageAction } from "./actions";

export type ServiceRow = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  bufferAfterMinutes: number;
  color: string;
  isActive: boolean;
  isOnlineBookable: boolean;
  staffIds: string[];
  imageUrl: string | null;
};
type StaffOption = { id: string; name: string; color: string; photoUrl: string | null };

const DURATIONS = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360, 480];
const COLORS = [
  "#3563E9",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#16A34A",
  "#0891B2",
  "#CA8A04",
  "#475467",
];

export function ServicesView({
  services,
  staff,
}: {
  services: ServiceRow[];
  staff: StaffOption[];
}) {
  const [editing, setEditing] = useState<ServiceRow | "new" | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> Nouveau service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={<Scissors />}
          title="Aucun service pour l'instant"
          description="Ajoutez vos prestations pour que vos clients puissent réserver en ligne."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus /> Créer mon premier service
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <li
              key={s.id}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs"
              data-testid="service-card"
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt=""
                  className="aspect-[3/1] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-1.5" style={{ backgroundColor: s.color }} />
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{s.name}</h3>
                    {s.description ? (
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
                        {s.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {s.priceCents ? formatCents(s.priceCents) : "Gratuit"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {formatDuration(s.durationMinutes)}
                  </span>
                  {s.bufferAfterMinutes ? (
                    <span>+ {s.bufferAfterMinutes} min de battement</span>
                  ) : null}
                  {!s.isActive ? (
                    <Badge>Désactivé</Badge>
                  ) : !s.isOnlineBookable ? (
                    <Badge>
                      <EyeOff className="size-3" /> Hors ligne
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <div className="flex -space-x-2">
                    {s.staffIds.length ? (
                      s.staffIds.slice(0, 5).map((id) => {
                        const p = staff.find((x) => x.id === id);
                        return p ? (
                          <Avatar
                            key={id}
                            name={p.name}
                            src={p.photoUrl}
                            color={p.color}
                            className="size-7 border-2 border-card text-[10px]"
                          />
                        ) : null;
                      })
                    ) : (
                      <span className="text-[13px] text-warning">Aucun employé attribué</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifier ${s.name}`}
                      onClick={() => setEditing(s)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer ${s.name}`}
                      disabled={pending}
                      onClick={() => {
                        if (
                          !confirm(
                            `Supprimer le service « ${s.name} » ? Les rendez-vous passés sont conservés.`,
                          )
                        )
                          return;
                        startTransition(async () => {
                          const res = await deleteServiceAction(s.id);
                          if (res.ok) toast.success(res.message);
                          else toast.error(res.error);
                          router.refresh();
                        });
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        {editing ? (
          <ServiceForm
            key={editing === "new" ? "new" : editing.id}
            service={editing === "new" ? null : editing}
            staff={staff}
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>
    </>
  );
}

function ServiceForm({
  service,
  staff,
  onDone,
}: {
  service: ServiceRow | null;
  staff: StaffOption[];
  onDone: () => void;
}) {
  const [v, setV] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    durationMinutes: service?.durationMinutes ?? 30,
    price: service ? (service.priceCents / 100).toFixed(2).replace(".", ",") : "",
    bufferAfterMinutes: service?.bufferAfterMinutes ?? 0,
    color: service?.color ?? COLORS[0],
    isActive: service?.isActive ?? true,
    isOnlineBookable: service?.isOnlineBookable ?? true,
    staffIds: new Set(service?.staffIds ?? staff.map((s) => s.id)),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const durations = DURATIONS.includes(v.durationMinutes)
    ? DURATIONS
    : [...DURATIONS, v.durationMinutes].sort((a, b) => a - b);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum =
      v.price.trim() === "" ? 0 : Number(v.price.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return setErrors({ priceCents: "Prix invalide." });
    startTransition(async () => {
      const res = await saveServiceAction(service?.id ?? null, {
        name: v.name,
        description: v.description,
        durationMinutes: v.durationMinutes,
        priceCents: Math.round(priceNum * 100),
        bufferAfterMinutes: v.bufferAfterMinutes,
        color: v.color,
        isActive: v.isActive,
        isOnlineBookable: v.isOnlineBookable,
        staffIds: [...v.staffIds],
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? { form: res.error });
        return;
      }
      toast.success(res.message);
      onDone();
    });
  }

  return (
    <DialogContent
      title={service ? "Modifier le service" : "Nouveau service"}
      className="sm:max-w-xl"
    >
      <form onSubmit={submit} className="grid gap-5" noValidate>
        {errors.form ? <Alert variant="error">{errors.form}</Alert> : null}
        <Field id="svc-name" label="Nom" error={errors.name}>
          <Input
            id="svc-name"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
            placeholder="Coupe femme"
            required
          />
        </Field>
        <Field id="svc-desc" label="Description (facultatif)" error={errors.description}>
          <Textarea
            id="svc-desc"
            value={v.description}
            maxLength={500}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            className="min-h-20"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="svc-duration" label="Durée" error={errors.durationMinutes}>
            <NativeSelect
              id="svc-duration"
              value={v.durationMinutes}
              onChange={(e) => setV({ ...v, durationMinutes: Number(e.target.value) })}
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="svc-price" label="Prix (€)" error={errors.priceCents}>
            <Input
              id="svc-price"
              inputMode="decimal"
              value={v.price}
              onChange={(e) => setV({ ...v, price: e.target.value })}
              placeholder="0,00"
            />
          </Field>
          <Field id="svc-buffer" label="Battement après" error={errors.bufferAfterMinutes}>
            <NativeSelect
              id="svc-buffer"
              value={v.bufferAfterMinutes}
              onChange={(e) => setV({ ...v, bufferAfterMinutes: Number(e.target.value) })}
            >
              {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m ? `${m} min` : "Aucun"}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Couleur</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Couleur ${c}`}
                aria-pressed={v.color === c}
                onClick={() => setV({ ...v, color: c })}
                className="size-7 rounded-full ring-offset-2 ring-offset-card aria-pressed:ring-2 aria-pressed:ring-foreground"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Réalisé par</legend>
          {staff.length ? (
            <ul className="grid gap-1 sm:grid-cols-2">
              {staff.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent">
                    <Checkbox
                      checked={v.staffIds.has(s.id)}
                      onCheckedChange={(c) => {
                        const next = new Set(v.staffIds);
                        if (c) next.add(s.id);
                        else next.delete(s.id);
                        setV({ ...v, staffIds: next });
                      }}
                    />
                    <Avatar
                      name={s.name}
                      src={s.photoUrl}
                      color={s.color}
                      className="size-6 text-[10px]"
                    />
                    <span className="truncate text-sm">{s.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun employé actif.</p>
          )}
        </fieldset>
        <div className="grid gap-3 rounded-lg border p-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Réservable en ligne</span>
              <span className="block text-[13px] text-muted-foreground">
                Visible sur votre page de réservation.
              </span>
            </span>
            <Switch
              checked={v.isOnlineBookable}
              onCheckedChange={(c) => setV({ ...v, isOnlineBookable: c })}
              aria-label="Réservable en ligne"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Service actif</span>
              <span className="block text-[13px] text-muted-foreground">
                Désactivé, il ne peut plus être réservé.
              </span>
            </span>
            <Switch
              checked={v.isActive}
              onCheckedChange={(c) => setV({ ...v, isActive: c })}
              aria-label="Service actif"
            />
          </label>
        </div>
        {service ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Image (facultatif)</p>
            <ImageUpload
              label="Image du service"
              shape="wide"
              url={service.imageUrl}
              onUpload={(fd) => setServiceImageAction(service.id, fd)}
              onRemove={() => setServiceImageAction(service.id, new FormData())}
            />
          </div>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <Spinner /> : null}
          {service ? "Enregistrer" : "Créer le service"}
        </Button>
      </form>
    </DialogContent>
  );
}
