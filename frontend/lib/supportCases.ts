import type {
  LostPassReason,
  SupportCaseResolution,
  SupportCaseStatus,
} from "@/lib/api/types";

type BadgeTone = "blue" | "green" | "orange" | "red";

export const supportCaseStatusLabels: Record<SupportCaseStatus, string> = {
  OPEN: "Declaration recue",
  IN_PROGRESS: "En cours de traitement",
  TRANSFER_TO_PHONE_REQUESTED: "Transfert telephone demande",
  PASS_DEACTIVATION_REQUESTED: "Desactivation demandee",
  RESOLVED: "Demande traitee",
  CANCELLED_BY_USER: "Annulee",
};

export const supportCaseStatusTones: Record<SupportCaseStatus, BadgeTone> = {
  OPEN: "blue",
  IN_PROGRESS: "orange",
  TRANSFER_TO_PHONE_REQUESTED: "blue",
  PASS_DEACTIVATION_REQUESTED: "orange",
  RESOLVED: "green",
  CANCELLED_BY_USER: "red",
};

export const lostPassReasonLabels: Record<LostPassReason, string> = {
  LOST: "Passe perdu",
  STOLEN: "Passe vole",
  DAMAGED: "Passe endommage",
  UNKNOWN: "Raison non precisee",
};

export const resolutionLabels: Record<SupportCaseResolution, string> = {
  TRANSFER_TO_PHONE: "Transfert sur telephone",
  DEACTIVATE_ONLY: "Desactivation du pass",
};

// MVP : reproduit la logique du backend pour afficher un numero de pass masque
// stable (aucun vrai numero n'est stocke ni manipule).
export function simulateMaskedPass(memberId: string) {
  let hash = 0;
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  const lastFour = (hash % 10000).toString().padStart(4, "0");
  return `**** ${lastFour}`;
}

export function formatSupportCaseDate(isoDate: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}
