import { Badge } from "../atoms/Badge";
import type { SubscriptionDocumentStatus } from "@/lib/api/types";

type DocumentStatusBadgeProps = {
  status: SubscriptionDocumentStatus;
};

const labels: Record<SubscriptionDocumentStatus, string> = {
  MISSING: "À fournir",
  READY: "Prêt",
  UPLOADED: "Ajouté",
  UNDER_REVIEW: "En vérification",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
};

const tones: Record<SubscriptionDocumentStatus, "blue" | "green" | "orange" | "red"> = {
  MISSING: "orange",
  READY: "green",
  UPLOADED: "blue",
  UNDER_REVIEW: "blue",
  VALIDATED: "green",
  REJECTED: "red",
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
