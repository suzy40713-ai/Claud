"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { createCustomer, deleteCustomer, updateCustomer } from "@/server/customers/service";

function refresh<T>(res: T): T {
  revalidatePath("/tableau-de-bord/clients", "layout");
  return res;
}

export async function saveCustomerAction(
  id: string | null,
  input: Parameters<typeof createCustomer>[1],
) {
  const ctx = await requireOrg();
  return refresh(
    await runAction(
      async () => {
        if (id) {
          await updateCustomer(ctx, id, input);
          return { id };
        }
        return { id: (await createCustomer(ctx, input)).id };
      },
      id ? "Client modifié." : "Client créé.",
    ),
  );
}

export async function deleteCustomerAction(id: string) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => deleteCustomer(ctx, id), "Client supprimé."));
}
