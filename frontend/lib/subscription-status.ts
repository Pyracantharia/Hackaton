import type { SubscriptionRequestStatus } from "./api/types";

const labels: Record<SubscriptionRequestStatus, string> = {
  DRAFT: "Brouillon",
  WAITING_DOCUMENTS: "Justificatifs attendus",
  PAYMENT_PENDING: "Paiement à confirmer",
  PAYMENT_CONFIRMED: "Paiement confirmé",
  PAYMENT_CANCELLED: "Paiement annulé",
  UNDER_REVIEW: "En vérification",
  CONFIRMED: "Confirmée",
  ACTIVE: "Active",
  BLOCKED: "Correction nécessaire",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
};

export function getSubscriptionRequestStatusLabel(status: SubscriptionRequestStatus) {
  return labels[status] ?? "En cours";
}
