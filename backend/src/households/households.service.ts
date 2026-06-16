import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

type DashboardStatus =
  | "ACTIVE"
  | "TO_RENEW"
  | "RECOMMENDED"
  | "PENDING_DOCUMENT"
  | "BLOCKED"
  | "LOST"
  | "EXPIRED";

type DashboardMember = {
  id: string;
  firstName: string;
  lastName: string;
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
};

type DashboardNotification = {
  id: string;
  type: "RENEWAL" | "OFFER_RECOMMENDATION" | "SERVICE_INFO" | "SUPPORT_UPDATE";
  severity: "INFO" | "WARNING" | "SUCCESS" | "DANGER";
  title: string;
  message: string;
  memberId: string | null;
  createdAt: string;
};

type DashboardActivity = {
  id: string;
  label: string;
  createdAt: string;
};

@Injectable()
export class HouseholdsService {
  constructor(private readonly prismaService: PrismaService) {}

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

  private getDefaultSubscription(profileType: DashboardMember["profileType"]) {
    if (profileType === "MANAGER") {
      return {
        currentProduct: "Navigo Annuel",
        recommendedProduct: null,
        status: "ACTIVE" as const,
        nextAction: "Voir mon titre",
      };
    }

    if (profileType === "YOUNG") {
      return {
        currentProduct: "Imagine R Scolaire",
        recommendedProduct: null,
        status: "TO_RENEW" as const,
        nextAction: "Renouveler avant la rentrée",
      };
    }

    return {
      currentProduct: "Titre à définir",
      recommendedProduct: null,
      status: "ACTIVE" as const,
      nextAction: "Voir le profil",
    };
  }

  private buildMemberView(
    member: {
      id: string;
      firstName: string;
      lastName: string;
      relationship: "SELF" | "CHILD" | "RELATIVE";
      profileType: "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";
      isHolder: boolean;
      isPayer: boolean;
      isLegalRepresentative: boolean;
      supportCases: Array<{
        type: "LOST_PASS" | "FOUND_PASS" | "DOCUMENT_REJECTED" | "PAYMENT_BLOCKED";
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
      }>;
      subscriptions: Array<{
        productName: string;
        status: DashboardStatus;
        nextActionLabel: string | null;
        recommendedProduct: string | null;
      }>;
    },
    managerName: string,
  ): DashboardMember {
    const profileType = this.getEffectiveProfileType(member);
    const subscription = member.subscriptions[0];
    const defaults = this.getDefaultSubscription(profileType);
    const hasOpenLostPass = member.supportCases.some(
      (supportCase) => supportCase.type === "LOST_PASS" && supportCase.status !== "RESOLVED",
    );

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
      relationship: member.relationship,
      relationLabel,
      profileType,
      currentProduct: subscription?.productName ?? defaults.currentProduct,
      recommendedProduct: subscription?.recommendedProduct ?? defaults.recommendedProduct,
      status: hasOpenLostPass ? "LOST" : (subscription?.status ?? defaults.status),
      nextAction: hasOpenLostPass ? "Suivre la demande de remplacement" : (subscription?.nextActionLabel ?? defaults.nextAction),
      payerName: member.isPayer ? `${member.firstName} ${member.lastName}` : managerName,
      isHolder: member.isHolder,
      isPayer: member.isPayer,
      isLegalRepresentative: member.isLegalRepresentative,
      isDemoProfile: false,
    };
  }

  private buildNotifications(
    household: Awaited<ReturnType<HouseholdsService["findHouseholdRecordForUser"]>>,
  ): DashboardNotification[] {
    return household.notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      memberId: notification.memberId,
      createdAt: notification.createdAt.toISOString(),
    }));
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
        offersToCheckCount: members.filter((member) => member.status === "RECOMMENDED").length,
      },
      members,
      notifications,
      recentActivity,
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
      ...detail,
      alerts: notifications.filter((notification) => notification.memberId === member.id || notification.memberId === null),
    };
  }
}
