import { Badge } from "../atoms/Badge";
import type { DashboardMemberStatus } from "@/lib/api/types";

type StatusBadgeProps = {
  status: DashboardMemberStatus;
};

const labels: Record<DashboardMemberStatus, string> = {
  NO_SUBSCRIPTION: "Aucun titre",
  ACTIVE: "Actif",
  TO_RENEW: "A renouveler",
  RECOMMENDED: "Offre a verifier",
  PENDING_DOCUMENT: "Documents attendus",
  BLOCKED: "Bloque",
  LOST: "Perte declaree",
  EXPIRED: "Expire",
};

const tones: Record<DashboardMemberStatus, "blue" | "green" | "orange" | "red"> = {
  NO_SUBSCRIPTION: "blue",
  ACTIVE: "green",
  TO_RENEW: "orange",
  RECOMMENDED: "orange",
  PENDING_DOCUMENT: "orange",
  BLOCKED: "red",
  LOST: "red",
  EXPIRED: "red",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
