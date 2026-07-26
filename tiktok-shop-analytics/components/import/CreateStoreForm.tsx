"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createStore, type CreateStoreResult } from "@/lib/stores/actions";

const initialState: CreateStoreResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
    >
      {pending ? "Création..." : "Créer ma boutique"}
    </button>
  );
}

export function CreateStoreForm() {
  const [state, formAction] = useFormState(createStore, initialState);

  return (
    <div className="max-w-md rounded-lg border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        Créez votre boutique
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Toutes vos données (commandes, retours, dépenses pub) seront
        rattachées à cette boutique.
      </p>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Ma boutique TikTok Shop"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
