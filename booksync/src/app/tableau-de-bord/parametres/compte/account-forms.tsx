"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsSection } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_RULE, passwordSchema } from "@/lib/validation/auth";
import { deleteAccountAction, updateProfileAction } from "./actions";

export function AccountForms({
  name,
  email,
  hasPassword,
  ownedOrganizations,
}: {
  name: string;
  email: string;
  hasPassword: boolean;
  ownedOrganizations: string[];
}) {
  const [n, setN] = useState(name);
  const profile = useSave();

  return (
    <div className="grid gap-8">
      <SettingsSection
        title="Profil"
        description="Votre nom apparaît auprès de votre équipe et, si vous recevez des rendez-vous, de vos clients."
      >
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            profile.save(() => updateProfileAction({ name: n }));
          }}
        >
          <Field id="profile-name" label="Nom complet" error={profile.errors.form}>
            <Input
              id="profile-name"
              value={n}
              onChange={(e) => setN(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field
            id="profile-email"
            label="Email"
            hint="L'adresse de connexion ne peut pas être modifiée."
          >
            <Input id="profile-email" value={email} disabled />
          </Field>
          <Button type="submit" disabled={profile.pending} className="sm:justify-self-end">
            {profile.pending ? <Spinner /> : null}
            Enregistrer
          </Button>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Mot de passe"
        description="Les autres appareils connectés seront déconnectés après le changement."
      >
        {hasPassword ? (
          <PasswordForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous vous connectez avec Google. Pour définir un mot de passe, utilisez « Mot de passe
            oublié » depuis la page de connexion.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Vos données"
        description="Téléchargez une copie de vos données (RGPD : droit d'accès et de portabilité)."
      >
        <Button asChild variant="secondary">
          <a href="/api/compte/export" download>
            <Download /> Exporter mes données (JSON)
          </a>
        </Button>
      </SettingsSection>

      <SettingsSection
        title="Supprimer mon compte"
        description="Action définitive et irréversible."
      >
        <DeleteAccount ownedOrganizations={ownedOrganizations} />
      </SettingsSection>
    </div>
  );
}

function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ current?: string; next?: string; form?: string }>({});
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const current = String(fd.get("current") ?? "");
        const next = String(fd.get("next") ?? "");
        const parsed = passwordSchema.safeParse(next);
        if (!current) return setErrors({ current: "Indiquez votre mot de passe actuel." });
        if (!parsed.success) return setErrors({ next: parsed.error.issues[0].message });
        setErrors({});
        startTransition(async () => {
          const { error } = await authClient.changePassword({
            currentPassword: current,
            newPassword: next,
            revokeOtherSessions: true,
          });
          if (error) {
            setErrors({
              form:
                error.code === "INVALID_PASSWORD"
                  ? "Mot de passe actuel incorrect."
                  : authErrorMessage(error),
            });
            return;
          }
          form.reset();
          toast.success("Mot de passe modifié.");
        });
      }}
    >
      {errors.form ? <Alert variant="error">{errors.form}</Alert> : null}
      <Field id="current" label="Mot de passe actuel" error={errors.current}>
        <PasswordInput id="current" name="current" autoComplete="current-password" />
      </Field>
      <Field id="next" label="Nouveau mot de passe" hint={PASSWORD_RULE} error={errors.next}>
        <PasswordInput id="next" name="next" autoComplete="new-password" />
      </Field>
      <Button type="submit" disabled={pending} className="sm:justify-self-end">
        {pending ? <Spinner /> : null}
        Modifier le mot de passe
      </Button>
    </form>
  );
}

function DeleteAccount({ ownedOrganizations }: { ownedOrganizations: string[] }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Votre compte, vos accès et vos données personnelles seront supprimés.
        {ownedOrganizations.length
          ? " Les entreprises dont vous êtes propriétaire seront supprimées avec toutes leurs données."
          : ""}
      </p>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="sm:justify-self-start">
            <Trash2 /> Supprimer mon compte
          </Button>
        </DialogTrigger>
        <DialogContent
          title="Supprimer définitivement votre compte ?"
          description="Cette action ne peut pas être annulée. Pensez à exporter vos données avant."
        >
          <div className="grid gap-5">
            {ownedOrganizations.length ? (
              <Alert variant="error">
                Seront également supprimées, avec leurs rendez-vous, clients, services et abonnement
                : <strong>{ownedOrganizations.join(", ")}</strong>. Vos collaborateurs perdront leur
                accès.
              </Alert>
            ) : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <Field id="confirm-delete" label="Pour confirmer, saisissez SUPPRIMER">
              <Input
                id="confirm-delete"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Button
              variant="destructive"
              size="lg"
              disabled={pending || confirmation.trim().toUpperCase() !== "SUPPRIMER"}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteAccountAction(confirmation);
                  if (!res.ok) return setError(res.error);
                  router.replace("/?compte=supprime");
                  router.refresh();
                })
              }
            >
              {pending ? <Spinner /> : null}
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
