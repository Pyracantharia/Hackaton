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
    members: DashboardMember[],
  ): DashboardNotification[] {
    const mappedNotifications = household.notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      memberId: notification.memberId,
      createdAt: notification.createdAt.toISOString(),
    }));

    const childMember = members.find((member) => member.profileType === "YOUNG");
    const hasRenewalNotification = mappedNotifications.some((notification) => notification.type === "RENEWAL");
    if (childMember && !hasRenewalNotification) {
      mappedNotifications.unshift({
        id: "synthetic-renewal",
        type: "RENEWAL",
        severity: "WARNING",
        title: `${childMember.firstName} — Renouvellement Imagine R conseillé`,
        message:
          "Les demandes sont nombreuses avant la rentrée. Renouvelez dès maintenant pour éviter les délais.",
        memberId: childMember.id,
        createdAt: new Date().toISOString(),
      });
    }

    mappedNotifications.push({
      id: "synthetic-service-info",
      type: "SERVICE_INFO",
      severity: "INFO",
      title: "Information service",
      message:
        "Les alertes importantes sont liées au suivi de vos titres et ne sont pas des communications commerciales.",
      memberId: null,
      createdAt: new Date().toISOString(),
    });

    return mappedNotifications;
  }

  private buildRecentActivity(
    household: Awaited<ReturnType<HouseholdsService["findHouseholdRecordForUser"]>>,
    members: DashboardMember[],
  ): DashboardActivity[] {
    const manager = members.find((member) => member.profileType === "MANAGER");
    const youngMember = members.find((member) => member.profileType === "YOUNG");
    const activities: DashboardActivity[] = [
      {
        id: "activity-household-created",
        label: "Espace famille créé.",
        createdAt: household.createdAt.toISOString(),
      },
    ];

    for (const member of household.members) {
      if (member.relationship === "CHILD") {
        activities.push({
          id: `activity-member-${member.id}`,
          label: `${member.firstName} a été ajouté comme profil enfant.`,
          createdAt: member.createdAt.toISOString(),
        });
      }
    }

    if (manager?.isPayer) {
      activities.push({
        id: "activity-payer-confirmed",
        label: `Role payeur confirme pour ${manager.firstName}.`,
        createdAt: household.updatedAt.toISOString(),
      });
    }

    if (youngMember) {
      activities.push({
        id: "activity-young-recommendation",
        label: `Renouvellement Imagine R recommande pour ${youngMember.firstName}.`,
        createdAt: household.updatedAt.toISOString(),
      });
    }

    for (const supportCase of household.supportCases.slice(0, 3)) {
      activities.push({
        id: `activity-support-${supportCase.id}`,
        label:
          supportCase.type === "LOST_PASS"
            ? "Une déclaration de passe perdu a été enregistrée."
            : "Un passe trouvé a été signalé.",
        createdAt: supportCase.createdAt.toISOString(),
      });
    }

    return activities
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 6);
  }

  private buildMemberDetail(member: DashboardMember, managerName: string) {
    if (member.profileType === "YOUNG") {
      return {
        householdRole: "Porteur du titre",
        overview: "Lucas peut être renouvelé dès maintenant pour anticiper la rentrée scolaire.",
        supportNote: `Payeur : ${managerName}. Documents attendus : photo récente et certificat scolaire.`,
        accessibilityNote: null,
        documents: ["Photo récente", "Certificat scolaire", "Pièce d'identité si demandée"],
        actions: [
          {
            label: "Commencer le renouvellement",
            href: `/dashboard/family/renewal/${member.id}`,
            variant: "primary",
          },
          {
            label: "Voir les justificatifs",
            href: `/dashboard/family/members/${member.id}#documents`,
            variant: "secondary",
          },
        ],
      };
    }

    if (member.profileType === "SENIOR") {
      return {
        householdRole: "Profil accompagné",
        overview: "Ce profil peut etre oriente vers une offre senior adaptee selon sa situation.",
        supportNote: `Profil accompagné par ${managerName}. Ce parcours doit rester lisible et rassurant.`,
        accessibilityNote: "Parcours renforcé avec textes simples et actions claires.",
        documents: ["Justificatif de domicile", "Document d'éligibilité éventuel", "Pièce d'identité"],
        actions: [
          {
            label: "Vérifier l'offre adaptée",
            href: `/dashboard/family/members/${member.id}#eligibilite`,
            variant: "primary",
          },
          {
            label: "Préparer les justificatifs",
            href: `/dashboard/family/members/${member.id}#documents`,
            variant: "secondary",
          },
          {
            label: "Demander de l'aide",
            href: "/dashboard/family?tab=help",
            variant: "ghost",
          },
        ],
      };
    }

    return {
      householdRole: "Gestionnaire du foyer",
      overview: "Votre espace centralise les profils, les paiements et les prochaines actions du foyer.",
      supportNote: "Vous êtes le point d'entrée principal pour le suivi des dossiers et des alertes.",
      accessibilityNote: null,
      documents: ["Attestation employeur", "RIB si nécessaire"],
      actions: [
        {
          label: "Voir mon titre",
          href: "/dashboard/family?tab=profiles",
          variant: "primary",
        },
        {
          label: "Attestation employeur",
          href: "/dashboard/family",
          variant: "secondary",
        },
      ],
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
    const notifications = this.buildNotifications(household, members);
    const recentActivity = this.buildRecentActivity(household, members);

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
    const dashboard = await this.getDashboardForUser(userId);
    const member = dashboard.members.find((candidate) => candidate.id === memberId);

    if (!member) {
      throw new NotFoundException("Aucun profil foyer trouvé pour cet identifiant.");
    }

    const managerName = `${dashboard.manager.firstName} ${dashboard.manager.lastName}`.trim();
    const detail = this.buildMemberDetail(member, managerName);

    return {
      household: dashboard.household,
      manager: dashboard.manager,
      member,
      ...detail,
      alerts: dashboard.notifications.filter((notification) => notification.memberId === member.id),
    };
  }
}
