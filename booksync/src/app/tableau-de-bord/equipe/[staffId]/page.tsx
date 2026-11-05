import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSection } from "@/components/settings/section";
import { can, ROLE_LABELS } from "@/domain/permissions";
import { fileUrl } from "@/lib/files";
import { requireOrg } from "@/server/auth/session";
import { getStaffDetail } from "@/server/catalog/staff";
import { ForbiddenError } from "@/domain/permissions";
import { NotFoundError } from "@/server/errors";
import { StaffDetailClient } from "./staff-detail-client";

export const metadata: Metadata = { title: "Profil et horaires" };

async function Content({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;
  const ctx = await requireOrg();
  let detail;
  try {
    detail = await getStaffDetail(ctx, staffId);
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof ForbiddenError) notFound();
    throw e;
  }
  const manageAll = can(ctx.role, "staff.manage_all");
  return (
    <>
      {can(ctx.role, "team.view") ? (
        <Link href="/tableau-de-bord/equipe" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Employés
        </Link>
      ) : null}
      <PageHeader
        title={detail.displayName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {detail.email ?? "Ancien membre de l'équipe"}
            {detail.role ? <Badge variant="outline">{ROLE_LABELS[detail.role]}</Badge> : <Badge>Inactif</Badge>}
          </span>
        }
      />
      <div className="grid gap-8">
        <StaffDetailClient
          staffId={detail.id}
          timeZone={ctx.organization.timezone}
          canManageAll={manageAll}
          profile={{
            displayName: detail.displayName,
            bio: detail.bio ?? "",
            color: detail.color,
            isBookable: detail.isBookable,
            photoUrl: fileUrl(detail.photoFileId),
          }}
          week={detail.week}
          services={detail.services}
          serviceIds={detail.serviceIds}
          absences={detail.absences.map((a) => ({ id: a.id, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), reason: a.reason }))}
        />
      </div>
      {!manageAll ? (
        <div className="mt-8">
          <SettingsSection title="Services" description="Les prestations que vous réalisez sont définies par votre responsable.">
            <p className="text-sm text-muted-foreground">
              {detail.services.filter((s) => detail.serviceIds.includes(s.id)).map((s) => s.name).join(", ") || "Aucun service attribué."}
            </p>
          </SettingsSection>
        </div>
      ) : null}
    </>
  );
}

export default function StaffDetailPage(props: PageProps<"/tableau-de-bord/equipe/[staffId]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[700px]" />}>
      <Content params={props.params} />
    </Suspense>
  );
}
