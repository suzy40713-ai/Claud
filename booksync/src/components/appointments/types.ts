export type ApptView = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  source: "online" | "manual";
  serviceName: string;
  serviceId: string | null;
  priceCents: number;
  customerNote: string | null;
  internalNote: string | null;
  staffId: string;
  staffName: string;
  staffColor: string;
  serviceColor: string | null;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  cancelledBy: "customer" | "staff" | null;
  cancellationReason: string | null;
};

export type StaffOpt = { id: string; name: string; color: string };
export type ServiceOpt = { id: string; name: string; durationMinutes: number; priceCents: number; staffIds: string[] };

export const STATUS_LABELS: Record<ApptView["status"], string> = {
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Honoré",
  no_show: "Absent",
};
