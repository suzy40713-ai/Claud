"use client";

import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemePreferenceForm } from "@/components/settings/theme-preference-form";
import { SubscriptionPanel } from "@/components/settings/subscription-panel";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import type { PlanId } from "@/lib/config/plans";
import Link from "next/link";
import { Package } from "lucide-react";

export function SettingsTabs({
  email,
  fullName,
  plan,
  creditsRemaining,
  creditsLimit,
}: {
  email: string;
  fullName: string | null;
  plan: PlanId;
  creditsRemaining: number;
  creditsLimit: number;
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profil";

  return (
    <Tabs defaultValue={initialTab}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="profil">Profil</TabsTrigger>
        <TabsTrigger value="produit">Produit</TabsTrigger>
        <TabsTrigger value="preferences">Préférences</TabsTrigger>
        <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
        <TabsTrigger value="compte">Compte</TabsTrigger>
      </TabsList>

      <TabsContent value="profil">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm email={email} fullName={fullName} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="produit">
        <Card>
          <CardHeader>
            <CardTitle>Ton produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Modifie les informations de ton produit depuis la page dédiée.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/produit">
                <Package className="h-4 w-4" />
                Gérer mon produit
              </Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Thème</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemePreferenceForm />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="abonnement">
        <SubscriptionPanel currentPlan={plan} creditsRemaining={creditsRemaining} creditsLimit={creditsLimit} />
      </TabsContent>

      <TabsContent value="compte">
        <Card>
          <CardHeader>
            <CardTitle>Zone de danger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La suppression de ton compte est définitive et supprime toutes tes données (produits, rapports,
              contenus, plans).
            </p>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
