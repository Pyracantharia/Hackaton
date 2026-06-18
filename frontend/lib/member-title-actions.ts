import type { DashboardMember, MemberTitleActionStatus } from "@/lib/api/types";

type ActionTone = "blue" | "green" | "orange" | "red";

export type MemberTitleAction = {
  status: MemberTitleActionStatus;
  statusLabel: string;
  statusTone: ActionTone;
  message: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  canStartSubscription: boolean;
  blocksNewSubscription: boolean;
};

function getRequestHref(member: DashboardMember) {
  const request = member.pendingRequest;

  if (!request) {
    return `/dashboard/family/titles/recommendation?memberId=${member.id}`;
  }

  if (request.status === "DRAFT" && (request.flowType === "IMAGINE_R" || request.offerProductType.startsWith("IMAGINE_R"))) {
    return `/dashboard/family/subscriptions/imagine-r/new?memberId=${member.id}&requestId=${request.id}`;
  }

  return `/dashboard/family/subscriptions/${request.id}/confirmation`;
}

function inferStatus(member: DashboardMember): MemberTitleActionStatus {
  if (member.titleActionStatus) {
    return member.titleActionStatus;
  }

  if (member.hasActiveTitle) {
    return "ACTIVE_TITLE";
  }

  if (member.pendingRequest?.status === "DRAFT") {
    return "REQUEST_DRAFT";
  }

  if (member.pendingRequest) {
    return "REQUEST_IN_PROGRESS";
  }

  if (member.status === "TO_RENEW") {
    return "TITLE_TO_RENEW";
  }

  if (member.status === "EXPIRED") {
    return "TITLE_EXPIRED";
  }

  return "NO_TITLE";
}

export function getMemberTitleAction(member: DashboardMember): MemberTitleAction {
  const status = inferStatus(member);

  if (status === "REQUEST_DRAFT") {
    return {
      status,
      statusLabel: "Brouillon en cours",
      statusTone: "orange",
      message: "Un brouillon existe déjà pour ce profil.",
      primaryLabel: "Reprendre ma demande",
      primaryHref: getRequestHref(member),
      canStartSubscription: false,
      blocksNewSubscription: true,
    };
  }

  if (status === "REQUEST_IN_PROGRESS") {
    return {
      status,
      statusLabel: "Demande en cours",
      statusTone: "blue",
      message: "Une demande est déjà en cours pour ce profil.",
      primaryLabel: "Voir le suivi du dossier",
      primaryHref: getRequestHref(member),
      canStartSubscription: false,
      blocksNewSubscription: true,
    };
  }

  if (status === "ACTIVE_TITLE") {
    return {
      status,
      statusLabel: "Titre actif",
      statusTone: "green",
      message: "Ce profil possède déjà un titre actif.",
      primaryLabel: "Voir mon titre",
      primaryHref: `/dashboard/family/members/${member.id}#pass-navigo`,
      secondaryLabel: "Gérer le renouvellement",
      secondaryHref: `/dashboard/family/members/${member.id}#renewal`,
      canStartSubscription: false,
      blocksNewSubscription: true,
    };
  }

  if (status === "TITLE_TO_RENEW") {
    return {
      status,
      statusLabel: "À renouveler",
      statusTone: "orange",
      message: "Ce titre arrive bientôt à échéance.",
      primaryLabel: "Renouveler ce titre",
      primaryHref: `/dashboard/family/titles/recommendation?memberId=${member.id}`,
      canStartSubscription: true,
      blocksNewSubscription: false,
    };
  }

  if (status === "TITLE_EXPIRED") {
    return {
      status,
      statusLabel: "Titre expiré",
      statusTone: "red",
      message: "Ce titre est expiré.",
      primaryLabel: "Renouveler",
      primaryHref: `/dashboard/family/titles/recommendation?memberId=${member.id}`,
      canStartSubscription: true,
      blocksNewSubscription: false,
    };
  }

  return {
    status,
    statusLabel: member.profileType === "MANAGER" ? "Aucun titre" : "Offre à choisir",
    statusTone: "blue",
    message: "Aucun titre principal n'est rattaché à ce profil.",
    primaryLabel: "Trouver le bon titre",
    primaryHref: `/dashboard/family/titles/recommendation?memberId=${member.id}`,
    canStartSubscription: true,
    blocksNewSubscription: false,
  };
}
