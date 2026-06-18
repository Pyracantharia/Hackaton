import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { NavigoPassesService } from "src/navigo-passes/navigo-passes.service";
import { AddHouseholdMemberDto } from "./dtos/add-household-member.dto";

type DashboardStatus =
  | "NO_SUBSCRIPTION"
  | "ACTIVE"
  | "TO_RENEW"
  | "RECOMMENDED"
  | "PENDING_DOCUMENT"
  | "BLOCKED"
  | "LOST"
  | "EXPIRED";

type DashboardPendingRenewal = {
  enabled: boolean;
  type: "ANNUAL" | "MONTHLY" | null;
  status: "ACTIVE" | "DISABLED" | "CANCELLED" | "EXPIRED";
  months: number | null;
  monthsRemaining: number | null;
  nextDate: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  label: string;
  canCancel: boolean;
};

type DashboardPendingRequest = {
  id: string;
  requestNumber: string | null;
  status:
    | "DRAFT"
    | "WAITING_DOCUMENTS"
    | "UNDER_REVIEW"
    | "PAYMENT_PENDING"
    | "CONFIRMED"
    | "ACTIVE"
    | "BLOCKED"
    | "CANCELLED"
    | "REJECTED"
    | "EXPIRED";
  offerName: string;
  offerSlug: string;
  offerProductType: string;
  flowType: "GENERIC" | "IMAGINE_R" | null;
  updatedAt: string;
  renewal: DashboardPendingRenewal;
};

type DashboardTitleActionStatus =
  | "NO_TITLE"
  | "REQUEST_DRAFT"
  | "REQUEST_IN_PROGRESS"
  | "ACTIVE_TITLE"
  | "TITLE_TO_RENEW"
  | "TITLE_EXPIRED";

type DashboardMember = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  schoolLevel: "PRIMARY" | "COLLEGE" | "LYCEE" | "HIGHER_EDUCATION" | "OTHER" | null;
  department: "75" | "77" | "78" | "91" | "92" | "93" | "94" | "95" | null;
  relationship: "SELF" | "CHILD" | "RELATIVE";
  relationLabel: string;
  profileType: "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";
  currentProduct: string | null;
  recommendedProduct: string | null;
  status: DashboardStatus;
  nextAction: string;
  payerName: string | null;
  isHolder: boolean;
  isPayer: boolean;
  isLegalRepresentative: boolean;
  isDemoProfile: boolean;
  hasActiveTitle: boolean;
  titleActionStatus: DashboardTitleActionStatus;
  pendingRequest: DashboardPendingRequest | null;
};

type DashboardNotification = {
  id: string;
  type: "RENEWAL" | "OFFER_RECOMMENDATION" | "SERVICE_INFO" | "SUPPORT_UPDATE";
  severity: "INFO" | "WARNING" | "SUCCESS" | "DANGER";
  title: string;
  message: string;
  memberId: string | null;
  createdAt: string;
  subscriptionRequest: DashboardPendingRequest | null;
};

type DashboardActivity = {
  id: string;
  label: string;
  createdAt: string;
};

type ProcedureType =
  | "SUBSCRIPTION"
  | "RENEWAL"
  | "SOS_NAVIGO"
  | "FOUND_PASS"
  | "SUPPORT_SWITCH"
  | "DOCUMENT"
  | "PAYMENT";

type HouseholdProcedure = {
  id: string;
  profileName: string;
  profileId: string | null;
  type: ProcedureType;
  title: string;
  relatedTitle: string | null;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  detailUrl: string;
};

const OPEN_SUBSCRIPTION_REQUEST_STATUSES = [
  "DRAFT",
  "WAITING_DOCUMENTS",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "BLOCKED",
];

@Injectable()
export class HouseholdsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly navigoPassesService: NavigoPassesService,
  ) {}

  private async findHouseholdRecordForUser(userId: string) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: {
        owner: true,
        notifications: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
        supportCases: {
          orderBy: { createdAt: "desc" },
        },
        members: {
          orderBy: { createdAt: "asc" },
          include: {
            notifications: {
              orderBy: { createdAt: "desc" },
            },
            subscriptions: {
              orderBy: { updatedAt: "desc" },
            },
            profileDetail: {
              include: {
                actions: {
                  orderBy: { order: "asc" },
                },
              },
            },
            supportCases: {
              orderBy: { createdAt: "desc" },
            },
            subscriptionRequests: {
              orderBy: { updatedAt: "desc" },
              include: {
                offer: true,
              },
            },
            navigoPass: {
              include: {
                supportSwitches: {
                  orderBy: { createdAt: "desc" },
                  take: 6,
                },
              },
            },
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException("Aucun espace famille trouvé pour cet utilisateur.");
    }

    return household;
  }

  private getEffectiveProfileType(member: {
    profileType: "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";
    relationship: "SELF" | "CHILD" | "RELATIVE";
  }) {
    if (member.profileType !== "OTHER") {
      return member.profileType;
    }

    if (member.relationship === "SELF") {
      return "MANAGER" as const;
    }

    if (member.relationship === "CHILD") {
      return "YOUNG" as const;
    }

    return "OTHER" as const;
  }

  private getDefaultProfileState(profileType: DashboardMember["profileType"]) {
    if (profileType === "MANAGER") {
      return {
        currentProduct: null,
        recommendedProduct: null,
        status: "NO_SUBSCRIPTION" as const,
        nextAction: "Aucun titre rattaché pour le moment",
      };
    }

    if (profileType === "YOUNG") {
      return {
        currentProduct: null,
        recommendedProduct: null,
        status: "NO_SUBSCRIPTION" as const,
        nextAction: "Trouver le forfait adapté",
      };
    }

    if (profileType === "SENIOR") {
      return {
        currentProduct: null,
        recommendedProduct: null,
        status: "NO_SUBSCRIPTION" as const,
        nextAction: "Vérifier les offres adaptées",
      };
    }

    return {
      currentProduct: null,
      recommendedProduct: null,
      status: "NO_SUBSCRIPTION" as const,
      nextAction: "Voir le profil",
    };
  }

  private getProcedureStatusLabel(status: string) {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      WAITING_DOCUMENTS: "À compléter",
      UNDER_REVIEW: "En vérification",
      PAYMENT_PENDING: "En attente",
      CONFIRMED: "Validée",
      ACTIVE: "Terminée",
      BLOCKED: "À compléter",
      REJECTED: "Refusée",
      CANCELLED: "Annulée",
      MISSING: "À compléter",
      READY: "En attente",
      UPLOADED: "En vérification",
      VALIDATED: "Validée",
      OPEN: "En attente",
      IN_PROGRESS: "En vérification",
      TRANSFER_TO_PHONE_REQUESTED: "En vérification",
      PASS_DEACTIVATION_REQUESTED: "En vérification",
      PASS_FOUND_WAITING_PICKUP: "À compléter",
      PASS_PICKED_UP: "À compléter",
      DIGITAL_SUPPORT_CONFIRMED: "Terminée",
      PHYSICAL_PASS_REACTIVATION_REQUESTED: "En vérification",
      PHYSICAL_PASS_REACTIVATED: "Terminée",
      RESOLVED: "Terminée",
      CANCELLED_BY_USER: "Annulée",
      SUPPORT_SWITCH: "Terminée",
      RENEWAL_ACTIVE: "En attente",
    };

    return labels[status] ?? "En attente";
  }

  private getSubscriptionNextAction(status: string) {
    if (status === "DRAFT") return "Reprendre la démarche";
    if (status === "WAITING_DOCUMENTS") return "Ajouter les justificatifs attendus";
    if (status === "UNDER_REVIEW") return "Attendre la validation des justificatifs";
    if (status === "PAYMENT_PENDING") return "Confirmer le paiement";
    if (status === "REJECTED" || status === "BLOCKED") return "Corriger le dossier";
    if (status === "CONFIRMED" || status === "ACTIVE") return "Consulter le suivi";
    return "Voir le suivi";
  }

  private getSupportCaseNextAction(status: string) {
    if (status === "PASS_FOUND_WAITING_PICKUP") return "Récupérer le pass au guichet";
    if (status === "PASS_PICKED_UP") return "Choisir le support final";
    if (status === "OPEN" || status === "IN_PROGRESS") return "Suivre l'avancement";
    if (status === "TRANSFER_TO_PHONE_REQUESTED") return "Suivre le transfert sur téléphone";
    if (status === "PASS_DEACTIVATION_REQUESTED") return "Suivre la désactivation";
    if (status === "RESOLVED") return "Consulter le dossier terminé";
    return "Voir le détail";
  }

  private buildMemberView(
    member: {
      id: string;
      firstName: string;
      lastName: string;
      birthDate: Date | null;
      schoolLevel: "PRIMARY" | "COLLEGE" | "LYCEE" | "HIGHER_EDUCATION" | "OTHER" | null;
      department: string | null;
      relationship: "SELF" | "CHILD" | "RELATIVE";
      profileType: "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";
      isHolder: boolean;
      isPayer: boolean;
      isLegalRepresentative: boolean;
      supportCases: Array<{
        type: "LOST_PASS" | "FOUND_PASS" | "DOCUMENT_REJECTED" | "PAYMENT_BLOCKED";
        status:
          | "OPEN"
          | "IN_PROGRESS"
          | "TRANSFER_TO_PHONE_REQUESTED"
          | "PASS_DEACTIVATION_REQUESTED"
          | "PASS_FOUND_WAITING_PICKUP"
          | "PASS_PICKED_UP"
          | "DIGITAL_SUPPORT_CONFIRMED"
          | "PHYSICAL_PASS_REACTIVATION_REQUESTED"
          | "PHYSICAL_PASS_REACTIVATED"
          | "RESOLVED"
          | "CANCELLED_BY_USER";
      }>;
      subscriptions: Array<{
        productName: string;
        status: DashboardStatus;
        nextActionLabel: string | null;
        recommendedProduct: string | null;
      }>;
      subscriptionRequests: Array<{
        id: string;
        requestNumber: string | null;
        status: string;
        updatedAt: Date;
        autoRenewalEnabled: boolean;
        renewalType: "ANNUAL" | "MONTHLY" | null;
        renewalStatus: "ACTIVE" | "DISABLED" | "CANCELLED" | "EXPIRED";
        renewalMonths: number | null;
        renewalMonthsRemaining: number | null;
        renewalNextDate: Date | null;
        renewalActivatedAt: Date | null;
        renewalCancelledAt: Date | null;
        offer: {
          name: string;
          slug: string;
          productType: string;
        };
      }>;
    },
    managerName: string,
  ): DashboardMember {
    const profileType = this.getEffectiveProfileType(member);
    const defaults = this.getDefaultProfileState(profileType);
    const activeSubscription = member.subscriptions.find((subscription) => subscription.status === "ACTIVE") ?? null;
    const subscriptionToRenew = member.subscriptions.find((subscription) => subscription.status === "TO_RENEW") ?? null;
    const expiredSubscription = member.subscriptions.find((subscription) => subscription.status === "EXPIRED") ?? null;
    const latestSubscription = activeSubscription ?? subscriptionToRenew ?? expiredSubscription ?? member.subscriptions[0] ?? null;
    const hasActiveTitle = Boolean(activeSubscription);
    const hasOpenLostPass = member.supportCases.some(
      (supportCase) =>
        supportCase.type === "LOST_PASS" &&
        ![
          "RESOLVED",
          "CANCELLED_BY_USER",
          "DIGITAL_SUPPORT_CONFIRMED",
          "PHYSICAL_PASS_REACTIVATION_REQUESTED",
          "PHYSICAL_PASS_REACTIVATED",
        ].includes(supportCase.status),
    );
    const latestOpenRequest = member.subscriptionRequests.find((request) =>
      OPEN_SUBSCRIPTION_REQUEST_STATUSES.includes(request.status),
    );
    const pendingRequest = latestOpenRequest ? this.formatPendingRequest(latestOpenRequest) : null;
    const titleActionStatus: DashboardTitleActionStatus = activeSubscription
      ? "ACTIVE_TITLE"
      : subscriptionToRenew
        ? "TITLE_TO_RENEW"
        : expiredSubscription
          ? "TITLE_EXPIRED"
          : pendingRequest?.status === "DRAFT"
            ? "REQUEST_DRAFT"
            : pendingRequest
              ? "REQUEST_IN_PROGRESS"
              : "NO_TITLE";

    const relationLabel =
      profileType === "MANAGER"
        ? "Gestionnaire du foyer"
        : profileType === "YOUNG"
          ? "Enfant / jeune"
          : profileType === "SENIOR"
            ? "Parent âgé / retraitée"
            : "Profil accompagné";

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      birthDate: member.birthDate?.toISOString().slice(0, 10) ?? null,
      schoolLevel: member.schoolLevel,
      department: member.department as DashboardMember["department"],
      relationship: member.relationship,
      relationLabel,
      profileType,
      currentProduct: latestSubscription?.productName ?? defaults.currentProduct,
      recommendedProduct:
        latestSubscription?.recommendedProduct ??
        pendingRequest?.offerName ??
        defaults.recommendedProduct,
      status: hasOpenLostPass
        ? "LOST"
        : pendingRequest
          ? "PENDING_DOCUMENT"
          : (latestSubscription?.status ?? defaults.status),
      nextAction: hasOpenLostPass
        ? "Suivre la demande de remplacement"
        : pendingRequest
          ? "Demande envoyée : suivez la vérification du dossier"
          : (latestSubscription?.nextActionLabel ?? defaults.nextAction),
      payerName: member.isPayer ? `${member.firstName} ${member.lastName}` : managerName,
      isHolder: member.isHolder,
      isPayer: member.isPayer,
      isLegalRepresentative: member.isLegalRepresentative,
      isDemoProfile: false,
      hasActiveTitle,
      titleActionStatus,
      pendingRequest,
    };
  }

  private formatPendingRenewal(request: {
    autoRenewalEnabled: boolean;
    renewalType: "ANNUAL" | "MONTHLY" | null;
    renewalStatus: "ACTIVE" | "DISABLED" | "CANCELLED" | "EXPIRED";
    renewalMonths: number | null;
    renewalMonthsRemaining: number | null;
    renewalNextDate: Date | null;
    renewalActivatedAt: Date | null;
    renewalCancelledAt: Date | null;
  }): DashboardPendingRenewal {
    const enabled = Boolean(request.autoRenewalEnabled && request.renewalStatus === "ACTIVE");
    const type = request.renewalType ?? null;
    const status = request.renewalStatus ?? "DISABLED";
    const monthsRemaining = request.renewalMonthsRemaining ?? null;

    return {
      enabled,
      type,
      status,
      months: request.renewalMonths ?? null,
      monthsRemaining,
      nextDate: request.renewalNextDate?.toISOString() ?? null,
      activatedAt: request.renewalActivatedAt?.toISOString() ?? null,
      cancelledAt: request.renewalCancelledAt?.toISOString() ?? null,
      label: enabled
        ? type === "MONTHLY"
          ? `Reconduction active${monthsRemaining ? ` : ${monthsRemaining} mois restants` : ""}`
          : "Renouvellement automatique activé"
        : status === "CANCELLED"
          ? "Renouvellement désactivé"
          : "Aucun renouvellement automatique activé",
      canCancel: enabled,
    };
  }

  private formatPendingRequest(request: {
    id: string;
    requestNumber: string | null;
    status: string;
    flowType?: "GENERIC" | "IMAGINE_R" | null;
    updatedAt: Date;
    autoRenewalEnabled: boolean;
    renewalType: "ANNUAL" | "MONTHLY" | null;
    renewalStatus: "ACTIVE" | "DISABLED" | "CANCELLED" | "EXPIRED";
    renewalMonths: number | null;
    renewalMonthsRemaining: number | null;
    renewalNextDate: Date | null;
    renewalActivatedAt: Date | null;
    renewalCancelledAt: Date | null;
    offer: {
      name: string;
      slug: string;
      productType: string;
    };
  }): DashboardPendingRequest {
    return {
      id: request.id,
      requestNumber: request.requestNumber,
      status: request.status as DashboardPendingRequest["status"],
      offerName: request.offer.name,
      offerSlug: request.offer.slug,
      offerProductType: request.offer.productType,
      flowType: request.flowType ?? null,
      updatedAt: request.updatedAt.toISOString(),
      renewal: this.formatPendingRenewal(request),
    };
  }

  private buildNotifications(
    household: Awaited<ReturnType<HouseholdsService["findHouseholdRecordForUser"]>>,
  ): DashboardNotification[] {
    const pendingRequestsByMember = new Map<string, DashboardPendingRequest>();

    household.members.forEach((member) => {
      const latestOpenRequest = member.subscriptionRequests.find((request) =>
        OPEN_SUBSCRIPTION_REQUEST_STATUSES.includes(request.status),
      );

      if (latestOpenRequest) {
        pendingRequestsByMember.set(member.id, this.formatPendingRequest(latestOpenRequest));
      }
    });

    return household.notifications.map((notification) => {
      const canPointToSubscriptionRequest = notification.type !== "SUPPORT_UPDATE";

      return {
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        memberId: notification.memberId,
        createdAt: notification.createdAt.toISOString(),
        subscriptionRequest:
          notification.memberId && canPointToSubscriptionRequest
            ? (pendingRequestsByMember.get(notification.memberId) ?? null)
            : null,
      };
    });
  }

  private buildRecentActivity(
    household: Awaited<ReturnType<HouseholdsService["findHouseholdRecordForUser"]>>,
  ): DashboardActivity[] {
    return household.activities
      .map((activity) => ({
        id: activity.id,
        label: activity.label,
        createdAt: activity.createdAt.toISOString(),
      }))
      .slice(0, 6);
  }

  private formatActionVariant(variant: "PRIMARY" | "SECONDARY" | "GHOST") {
    return variant.toLowerCase() as "primary" | "secondary" | "ghost";
  }

  private getMemberCreationConfig(member: AddHouseholdMemberDto, managerName: string) {
    const isYoung = member.type === "YOUNG";

    return {
      activityLabel: isYoung
        ? `Profil jeune ajoute pour ${member.firstName}, sans titre rattache.`
        : `Offre Senior a verifier pour ${member.firstName}.`,
      detail: {
        householdRole: isYoung ? "Porteur du titre scolaire" : "Profil senior accompagne",
        overview: isYoung
          ? `${member.firstName} n'a pas encore de titre rattache. Vous pourrez choisir une offre adaptee a son profil.`
          : `${member.firstName} pourra verifier une offre Navigo Senior ou Amethyste adaptee a sa situation.`,
        supportNote: isYoung
          ? `Payeur : ${managerName}. Documents attendus : photo recente et certificat scolaire.`
          : `Gestionnaire : ${managerName}. Les justificatifs dependront de l'offre retenue.`,
        documents: isYoung
          ? ["Photo recente", "Certificat scolaire", "Piece d'identite si demandee"]
          : ["Piece d'identite", "Justificatif de domicile", "Justificatif de situation si demande"],
      },
      notification: isYoung
        ? {
            type: "OFFER_RECOMMENDATION" as const,
            severity: "INFO" as const,
            title: `${member.firstName} — Forfait jeune a choisir`,
            message:
              "Aucun titre n'est encore rattache. Vous pourrez comparer les offres jeune adaptees a son profil.",
          }
        : {
            type: "OFFER_RECOMMENDATION" as const,
            severity: "INFO" as const,
            title: `${member.firstName} — Offre Senior a verifier`,
            message:
              "Un accompagnement peut aider a identifier l'offre Navigo Senior ou Amethyste adaptee.",
          },
    };
  }

  private buildMemberDetail(
    member: DashboardMember,
    detail: Awaited<ReturnType<HouseholdsService["findHouseholdRecordForUser"]>>["members"][number]["profileDetail"],
  ) {
    if (!detail) {
      return {
        householdRole: member.relationLabel,
        overview: "Les informations detaillees de ce profil seront completees prochainement.",
        supportNote: member.payerName ? `Payeur : ${member.payerName}.` : "Aucun payeur rattache.",
        accessibilityNote: null,
        documents: [],
        actions: [
          {
            label: "Retour au foyer",
            href: "/dashboard/family",
            variant: "secondary" as const,
          },
        ],
      };
    }

    return {
      householdRole: detail.householdRole,
      overview: detail.overview,
      supportNote: detail.supportNote,
      accessibilityNote: detail.accessibilityNote,
      documents: detail.documents,
      actions: detail.actions.map((action) => ({
        label: action.label,
        href: action.href,
        action: action.action as "lost-pass" | undefined,
        variant: this.formatActionVariant(action.variant),
      })),
    };
  }

  async getHouseholdForUser(userId: string) {
    const household = await this.findHouseholdRecordForUser(userId);
    return household;
  }

  async getHouseholdMembersForUser(userId: string) {
    const household = await this.findHouseholdRecordForUser(userId);
    return household.members;
  }

  async getDashboardForUser(userId: string) {
    const household = await this.findHouseholdRecordForUser(userId);
    const managerName = `${household.owner.firstName} ${household.owner.lastName}`.trim();
    const members = household.members.map((member) => this.buildMemberView(member, managerName));
    const notifications = this.buildNotifications(household);
    const recentActivity = this.buildRecentActivity(household);

    return {
      household: {
        id: household.id,
        name: household.name,
      },
      manager: {
        id: household.owner.id,
        firstName: household.owner.firstName,
        lastName: household.owner.lastName,
      },
      summary: {
        membersCount: members.length,
        urgentActionsCount: members.filter((member) => member.status === "TO_RENEW" || member.status === "LOST").length,
        renewalsCount: members.filter((member) => member.status === "TO_RENEW").length,
        offersToCheckCount: members.filter((member) => member.profileType !== "MANAGER" && member.status === "NO_SUBSCRIPTION").length,
      },
      members,
      notifications,
      recentActivity,
    };
  }

  async getProceduresForUser(userId: string) {
    const household = await this.findHouseholdRecordForUser(userId);
    const procedures: HouseholdProcedure[] = [];
    const memberNameById = new Map(
      household.members.map((member) => [member.id, `${member.firstName} ${member.lastName}`.trim()]),
    );

    const subscriptionRequests = await this.prismaService.subscriptionRequest.findMany({
      where: { householdId: household.id },
      orderBy: { updatedAt: "desc" },
      include: {
        documents: true,
        member: true,
        offer: true,
      },
    });

    for (const request of subscriptionRequests) {
      const profileName = `${request.member.firstName} ${request.member.lastName}`.trim();
      const detailUrl = request.status === "DRAFT" && request.flowType === "IMAGINE_R"
        ? `/dashboard/family/subscriptions/imagine-r/new?requestId=${request.id}`
        : `/dashboard/family/subscriptions/${request.id}/confirmation`;

      procedures.push({
        id: `subscription-${request.id}`,
        profileId: request.memberId,
        profileName,
        type: "SUBSCRIPTION",
        title: `Souscription ${request.offer.name}`,
        relatedTitle: request.offer.name,
        status: request.status,
        statusLabel: this.getProcedureStatusLabel(request.status),
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        nextAction: this.getSubscriptionNextAction(request.status),
        detailUrl,
      });

      if (request.autoRenewalEnabled || request.renewalStatus === "ACTIVE") {
        const renewalStatus = request.renewalStatus === "ACTIVE" ? "RENEWAL_ACTIVE" : request.renewalStatus;

        procedures.push({
          id: `renewal-${request.id}`,
          profileId: request.memberId,
          profileName,
          type: "RENEWAL",
          title: `Renouvellement ${request.offer.name}`,
          relatedTitle: request.offer.name,
          status: renewalStatus,
          statusLabel: this.getProcedureStatusLabel(renewalStatus),
          createdAt: (request.renewalActivatedAt ?? request.createdAt).toISOString(),
          updatedAt: request.updatedAt.toISOString(),
          nextAction: request.renewalNextDate
            ? `Prochaine échéance le ${new Intl.DateTimeFormat("fr-FR").format(request.renewalNextDate)}`
            : "Suivre le renouvellement",
          detailUrl: `/dashboard/family/subscriptions/${request.id}/confirmation`,
        });
      }

      for (const document of request.documents) {
        if (!["MISSING", "UNDER_REVIEW", "VALIDATED", "REJECTED"].includes(document.status)) continue;

        procedures.push({
          id: `document-${document.id}`,
          profileId: request.memberId,
          profileName,
          type: "DOCUMENT",
          title: `Justificatif — ${document.label}`,
          relatedTitle: request.offer.name,
          status: document.status,
          statusLabel: this.getProcedureStatusLabel(document.status),
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          nextAction: document.status === "REJECTED"
            ? "Remplacer le justificatif refusé"
            : document.status === "MISSING"
              ? "Ajouter le justificatif"
              : document.status === "VALIDATED"
                ? "Justificatif validé"
                : "Attendre la vérification",
          detailUrl: `/dashboard/family/subscriptions/${request.id}/confirmation`,
        });
      }

      if (request.status === "PAYMENT_PENDING" || request.paymentSimulatedAt) {
        const paymentStatus = request.status === "PAYMENT_PENDING" ? "PAYMENT_PENDING" : "CONFIRMED";

        procedures.push({
          id: `payment-${request.id}`,
          profileId: request.memberId,
          profileName,
          type: "PAYMENT",
          title: `Paiement ${request.offer.name}`,
          relatedTitle: request.offer.name,
          status: paymentStatus,
          statusLabel: this.getProcedureStatusLabel(paymentStatus),
          createdAt: (request.paymentSimulatedAt ?? request.createdAt).toISOString(),
          updatedAt: request.updatedAt.toISOString(),
          nextAction: request.status === "PAYMENT_PENDING" ? "Confirmer le paiement" : "Paiement pris en compte",
          detailUrl: `/dashboard/family/subscriptions/${request.id}/confirmation`,
        });
      }
    }

    const supportCases = await this.prismaService.supportCase.findMany({
      where: { householdId: household.id },
      orderBy: { updatedAt: "desc" },
      include: { member: true },
    });

    for (const supportCase of supportCases) {
      const profileName = supportCase.member
        ? `${supportCase.member.firstName} ${supportCase.member.lastName}`.trim()
        : "Foyer";
      const isFoundPass = supportCase.type === "FOUND_PASS";

      procedures.push({
        id: `support-${supportCase.id}`,
        profileId: supportCase.memberId,
        profileName,
        type: isFoundPass ? "FOUND_PASS" : "SOS_NAVIGO",
        title: isFoundPass ? "SOS Navigo — Pass retrouvé" : "SOS Navigo — Pass déclaré perdu",
        relatedTitle: supportCase.passNumberMasked,
        status: supportCase.status,
        statusLabel: this.getProcedureStatusLabel(supportCase.status),
        createdAt: supportCase.createdAt.toISOString(),
        updatedAt: supportCase.updatedAt.toISOString(),
        nextAction: this.getSupportCaseNextAction(supportCase.status),
        detailUrl: `/dashboard/family/support-cases/${supportCase.id}`,
      });
    }

    for (const member of household.members) {
      const pass = member.navigoPass;
      if (!pass) continue;

      for (const supportSwitch of pass.supportSwitches) {
        procedures.push({
          id: `support-switch-${supportSwitch.id}`,
          profileId: member.id,
          profileName: memberNameById.get(member.id) ?? `${member.firstName} ${member.lastName}`.trim(),
          type: "SUPPORT_SWITCH",
          title: `Changement de support ${supportSwitch.previousSupport === "PHYSICAL" ? "physique" : "numérique"} → ${supportSwitch.newSupport === "PHYSICAL" ? "physique" : "numérique"}`,
          relatedTitle: pass.productName,
          status: "SUPPORT_SWITCH",
          statusLabel: this.getProcedureStatusLabel("SUPPORT_SWITCH"),
          createdAt: supportSwitch.createdAt.toISOString(),
          updatedAt: supportSwitch.createdAt.toISOString(),
          nextAction: "Changement de support enregistré",
          detailUrl: `/dashboard/family/members/${member.id}`,
        });
      }
    }

    return {
      procedures: procedures.sort((first, second) => (
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
      )),
    };
  }

  async getHouseholdMemberDetailForUser(userId: string, memberId: string) {
    const household = await this.findHouseholdRecordForUser(userId);
    const managerName = `${household.owner.firstName} ${household.owner.lastName}`.trim();
    const members = household.members.map((candidate) => this.buildMemberView(candidate, managerName));
    const notifications = this.buildNotifications(household);
    const member = members.find((candidate) => candidate.id === memberId);
    const memberRecord = household.members.find((candidate) => candidate.id === memberId);

    if (!member || !memberRecord) {
      throw new NotFoundException("Aucun profil foyer trouvé pour cet identifiant.");
    }

    const detail = this.buildMemberDetail(member, memberRecord.profileDetail);
    const navigoPass = await this.navigoPassesService.ensurePassFromMemberRecord(memberRecord);

    return {
      household: {
        id: household.id,
        name: household.name,
      },
      manager: {
        id: household.owner.id,
        firstName: household.owner.firstName,
        lastName: household.owner.lastName,
      },
      member,
      navigoPass,
      ...detail,
      alerts: notifications.filter((notification) => notification.memberId === member.id || notification.memberId === null),
    };
  }

  async addHouseholdMemberForUser(userId: string, data: AddHouseholdMemberDto) {
    if (data.type === "YOUNG" && !data.schoolLevel) {
      throw new BadRequestException("Le niveau scolaire est obligatoire pour ajouter un enfant / jeune.");
    }

    const household = await this.findHouseholdRecordForUser(userId);
    const managerName = `${household.owner.firstName} ${household.owner.lastName}`.trim();
    const config = this.getMemberCreationConfig(data, managerName);

    await this.prismaService.$transaction(async (tx) => {
      const member = await tx.householdMember.create({
        data: {
          householdId: household.id,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: new Date(data.birthDate),
          relationship: data.type === "YOUNG" ? "CHILD" : "RELATIVE",
          profileType: data.type,
          schoolLevel: data.type === "YOUNG" ? data.schoolLevel : null,
          department: data.department,
          isHolder: data.isHolder,
          isPayer: data.isPayer,
          isLegalRepresentative: false,
        },
      });

      await tx.familyNotification.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          ...config.notification,
        },
      });

      await tx.householdActivity.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          label: config.activityLabel,
        },
      });

      await tx.memberProfileDetail.create({
        data: {
          householdMemberId: member.id,
          householdRole: config.detail.householdRole,
          overview: config.detail.overview,
          supportNote: config.detail.supportNote,
          accessibilityNote: null,
          documents: config.detail.documents,
          actions: {
            create: data.type === "YOUNG"
              ? [
                  {
                    label: "Trouver une offre adaptee",
                    href: `/dashboard/family/titles/recommendation?memberId=${member.id}`,
                    variant: "PRIMARY",
                    order: 1,
                  },
                  {
                    label: "Voir les justificatifs",
                    href: `/dashboard/family/members/${member.id}#documents`,
                    variant: "SECONDARY",
                    order: 2,
                  },
                ]
              : [
                  {
                    label: "Verifier l'offre adaptee",
                    href: `/dashboard/family/members/${member.id}#eligibilite`,
                    variant: "PRIMARY",
                    order: 1,
                  },
                  {
                    label: "Voir le profil",
                    href: `/dashboard/family/members/${member.id}`,
                    variant: "SECONDARY",
                    order: 2,
                  },
                ],
          },
        },
      });
    });

    return this.getDashboardForUser(userId);
  }
}
