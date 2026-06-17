import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAdminFoundPassDto } from "./dtos/create-admin-found-pass.dto";
import { UpdateAdminSosCaseStatusDto } from "./dtos/update-admin-sos-case-status.dto";
import { UpdateAdminSubscriptionRequestDto } from "./dtos/update-admin-subscription-request.dto";
import { UpdateAdminSupportCaseDto } from "./dtos/update-admin-support-case.dto";

type FamilyRecord = any;
type SubscriptionRequestRecord = any;
type SupportCaseRecord = any;

const SOS_DESKS = [
  { name: "Gare de Lyon", address: "Place Louis-Armand, 75012 Paris" },
  { name: "Chatelet-Les Halles", address: "1 Place Marguerite de Navarre, 75001 Paris" },
  { name: "La Defense", address: "Parvis de La Defense, 92400 Courbevoie" },
  { name: "Saint-Denis Universite", address: "2 Rue Guynemer, 93200 Saint-Denis" },
  { name: "Versailles Chantiers", address: "4 Rue de l'Abbe Rousseaux, 78000 Versailles" },
];

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  private customerNumber(id: string) {
    return `CF-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }

  private fullName(person: { firstName: string; lastName: string }) {
    return `${person.firstName} ${person.lastName}`.trim();
  }

  private maskPassNumber(passNumber: string) {
    const sanitized = passNumber.replace(/[\s*-]/g, "");
    const visiblePart = sanitized.slice(-4);
    return `**** ${visiblePart}`;
  }

  private normalizePassNumber(passNumber: string | null) {
    return (passNumber ?? "").replace(/[\s*-]/g, "").toLowerCase();
  }

  private dossierNumber(supportCase: { id: string; createdAt: Date }) {
    const year = supportCase.createdAt.getFullYear();
    const segment = supportCase.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
    return `SOS-${year}-${segment}`;
  }

  private pickDesk(name?: string) {
    if (name) {
      return SOS_DESKS.find((desk) => desk.name === name) ?? SOS_DESKS[0];
    }

    return SOS_DESKS[Math.floor(Math.random() * SOS_DESKS.length)];
  }

  private isSosClosed(status: string) {
    return [
      "RESOLVED",
      "CANCELLED_BY_USER",
      "DIGITAL_SUPPORT_CONFIRMED",
      "PHYSICAL_PASS_REACTIVATION_REQUESTED",
    ].includes(status);
  }

  private getHouseholdStatus(household: {
    subscriptionRequests: Array<{ status: string }>;
    supportCases: Array<{ status: string }>;
  }) {
    if (household.supportCases.some((supportCase) => supportCase.status !== "RESOLVED")) {
      return "SUPPORT_OPEN";
    }

    if (household.subscriptionRequests.some((request) => request.status === "BLOCKED")) {
      return "BLOCKED";
    }

    if (household.subscriptionRequests.some((request) => request.status === "UNDER_REVIEW")) {
      return "TO_REVIEW";
    }

    if (household.subscriptionRequests.some((request) => request.status === "WAITING_DOCUMENTS")) {
      return "WAITING_DOCUMENTS";
    }

    return "OK";
  }

  private getLastEvent(household: {
    activities: Array<{ label: string; createdAt: Date }>;
    notifications: Array<{ title: string; createdAt: Date }>;
  }) {
    const events = [
      ...household.activities.map((activity) => ({
        label: activity.label,
        createdAt: activity.createdAt,
      })),
      ...household.notifications.map((notification) => ({
        label: notification.title,
        createdAt: notification.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return events[0]
      ? {
          label: events[0].label,
          createdAt: events[0].createdAt.toISOString(),
        }
      : null;
  }

  private formatSubscriptionRequest(request: SubscriptionRequestRecord) {
    return {
      id: request.id,
      status: request.status,
      autoRenewalEnabled: request.autoRenewalEnabled,
      intelligentDossierEnabled: request.intelligentDossierEnabled,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      household: {
        id: request.household.id,
        customerNumber: this.customerNumber(request.household.id),
        name: request.household.name,
        ownerName: this.fullName(request.household.owner),
      },
      member: {
        id: request.member.id,
        firstName: request.member.firstName,
        lastName: request.member.lastName,
        profileType: request.member.profileType,
      },
      payer: request.payerMember
        ? {
            id: request.payerMember.id,
            firstName: request.payerMember.firstName,
            lastName: request.payerMember.lastName,
          }
        : null,
      offer: {
        id: request.offer.id,
        slug: request.offer.slug,
        name: request.offer.name,
        productType: request.offer.productType,
        priceLabel: request.offer.priceLabel,
      },
      documents: request.documents.map((document) => ({
        id: document.id,
        label: document.label,
        documentType: document.documentType,
        status: document.status,
        rejectionReason: document.rejectionReason,
      })),
    };
  }

  private formatSupportCase(supportCase: SupportCaseRecord) {
    const memberSubscriptions = supportCase.member?.subscriptions ?? [];

    return {
      id: supportCase.id,
      dossierNumber: this.dossierNumber(supportCase),
      type: supportCase.type,
      status: supportCase.status,
      reason: supportCase.reason,
      chosenResolution: supportCase.chosenResolution,
      finalChoice: supportCase.finalChoice,
      description: supportCase.description,
      passNumberMasked: supportCase.passNumberMasked,
      foundLocation: supportCase.foundLocation,
      foundDeskName: supportCase.foundDeskName,
      foundDeskAddress: supportCase.foundDeskAddress,
      foundAt: supportCase.foundAt?.toISOString() ?? null,
      depositedAtDesk: supportCase.depositedAtDesk,
      clientNotifiedAt: supportCase.clientNotifiedAt?.toISOString() ?? null,
      pickedUpAt: supportCase.pickedUpAt?.toISOString() ?? null,
      finalChoiceAt: supportCase.finalChoiceAt?.toISOString() ?? null,
      createdAt: supportCase.createdAt.toISOString(),
      updatedAt: supportCase.updatedAt.toISOString(),
      resolvedAt: supportCase.resolvedAt?.toISOString() ?? null,
      household: supportCase.household
        ? {
            id: supportCase.household.id,
            customerNumber: this.customerNumber(supportCase.household.id),
            name: supportCase.household.name,
            ownerName: this.fullName(supportCase.household.owner),
          }
        : null,
      member: supportCase.member
        ? {
            id: supportCase.member.id,
            firstName: supportCase.member.firstName,
            lastName: supportCase.member.lastName,
            profileType: supportCase.member.profileType,
            birthDate: supportCase.member.birthDate?.toISOString?.() ?? null,
            currentTitle: memberSubscriptions[0]
              ? {
                  id: memberSubscriptions[0].id,
                  productName: memberSubscriptions[0].productName,
                  status: memberSubscriptions[0].status,
                }
              : null,
          }
        : null,
      possibleMatch: supportCase.household && supportCase.member
        ? `${this.fullName(supportCase.member)} - ${this.customerNumber(supportCase.household.id)}`
        : null,
    };
  }

  private formatFamilySummary(household: FamilyRecord) {
    const openRequests = household.subscriptionRequests.filter(
      (request) => !["CONFIRMED", "ACTIVE", "CANCELLED"].includes(request.status),
    );

    return {
      id: household.id,
      customerNumber: this.customerNumber(household.id),
      name: household.name,
      manager: {
        id: household.owner.id,
        firstName: household.owner.firstName,
        lastName: household.owner.lastName,
        email: household.owner.email,
        phone: household.owner.phone,
      },
      profilesCount: household.members.length,
      openRequestsCount: openRequests.length,
      lastEvent: this.getLastEvent(household),
      status: this.getHouseholdStatus(household),
    };
  }

  private formatFamilyDetail(household: FamilyRecord) {
    return {
      ...this.formatFamilySummary(household),
      members: household.members.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        birthDate: member.birthDate?.toISOString() ?? null,
        relationship: member.relationship,
        profileType: member.profileType,
        schoolLevel: member.schoolLevel,
        department: member.department,
        isHolder: member.isHolder,
        isPayer: member.isPayer,
        isLegalRepresentative: member.isLegalRepresentative,
        currentSubscription: member.subscriptions[0]
          ? {
              id: member.subscriptions[0].id,
              productName: member.subscriptions[0].productName,
              status: member.subscriptions[0].status,
              recommendedProduct: member.subscriptions[0].recommendedProduct,
              renewalDate: member.subscriptions[0].renewalDate?.toISOString() ?? null,
            }
          : null,
        subscriptionRequests: member.subscriptionRequests.map((request) => ({
          id: request.id,
          offerName: request.offer.name,
          status: request.status,
          intelligentDossierEnabled: request.intelligentDossierEnabled,
          autoRenewalEnabled: request.autoRenewalEnabled,
          createdAt: request.createdAt.toISOString(),
        })),
        expectedDocuments: member.profileDetail?.documents ?? [],
        supportCases: member.supportCases.map((supportCase) => ({
          id: supportCase.id,
          type: supportCase.type,
          status: supportCase.status,
          description: supportCase.description,
          createdAt: supportCase.createdAt.toISOString(),
        })),
      })),
      subscriptionRequests: household.subscriptionRequests.map((request) => this.formatSubscriptionRequest(request)),
      supportCases: household.supportCases.map((supportCase) => this.formatSupportCase(supportCase)),
      history: household.activities.map((activity) => ({
        id: activity.id,
        label: activity.label,
        memberId: activity.memberId,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  }

  private formatAdminUserFromAccount(user: any, household: any | null = null) {
    return {
      id: `user:${user.id}`,
      sourceId: user.id,
      recordType: "ACCOUNT",
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      customerNumber: household ? this.customerNumber(household.id) : null,
      type: household ? "MANAGER" : "OTHER",
      family: household
        ? {
            id: household.id,
            name: household.name,
            customerNumber: this.customerNumber(household.id),
          }
        : null,
      status: household ? this.getHouseholdStatus(household) : "OK",
    };
  }

  private formatAdminUserFromMember(member: any, household: any) {
    return {
      id: `member:${member.id}`,
      sourceId: member.id,
      recordType: "PROFILE",
      firstName: member.firstName,
      lastName: member.lastName,
      email: household.owner.email,
      role: "USER",
      customerNumber: this.customerNumber(household.id),
      type: member.profileType,
      family: {
        id: household.id,
        name: household.name,
        customerNumber: this.customerNumber(household.id),
      },
      status: this.getHouseholdStatus(household),
    };
  }

  private formatManagementDetailFromMember(member: any, household: any) {
    return {
      id: `member:${member.id}`,
      sourceId: member.id,
      recordType: "PROFILE",
      identity: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: household.owner.email,
        phone: household.owner.phone,
        role: "USER",
        type: member.profileType,
      },
      household: {
        id: household.id,
        name: household.name,
        customerNumber: this.customerNumber(household.id),
        managerName: this.fullName(household.owner),
        managerEmail: household.owner.email,
      },
      householdRole: member.relationship,
      flags: {
        isHolder: member.isHolder,
        isPayer: member.isPayer,
        isLegalRepresentative: member.isLegalRepresentative,
      },
      profiles: household.members.map((candidate) => ({
        id: `member:${candidate.id}`,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        profileType: candidate.profileType,
        relationship: candidate.relationship,
      })),
      subscriptions: member.subscriptions.map((subscription) => ({
        id: subscription.id,
        productName: subscription.productName,
        status: subscription.status,
        passNumberMasked: null,
        renewalDate: subscription.renewalDate?.toISOString() ?? null,
      })),
      subscriptionRequests: member.subscriptionRequests.map((request) => ({
        id: request.id,
        offerName: request.offer.name,
        status: request.status,
        intelligentDossierEnabled: request.intelligentDossierEnabled,
        autoRenewalEnabled: request.autoRenewalEnabled,
        documents: request.documents.map((document) => ({
          id: document.id,
          label: document.label,
          status: document.status,
          rejectionReason: document.rejectionReason,
        })),
        createdAt: request.createdAt.toISOString(),
      })),
      supportCases: member.supportCases.map((supportCase) => this.formatSupportCase({
        ...supportCase,
        household,
        member,
      })),
      expectedDocuments: member.profileDetail?.documents ?? [],
      history: household.activities
        .filter((activity) => activity.memberId === member.id || activity.memberId === null)
        .map((activity) => ({
          id: activity.id,
          label: activity.label,
          createdAt: activity.createdAt.toISOString(),
        })),
    };
  }

  private formatManagementDetailFromAccount(user: any, household: any | null) {
    if (!household) {
      return {
        id: `user:${user.id}`,
        sourceId: user.id,
        recordType: "ACCOUNT",
        identity: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          type: "OTHER",
        },
        household: null,
        householdRole: user.role,
        flags: {
          isHolder: false,
          isPayer: false,
          isLegalRepresentative: false,
        },
        profiles: [],
        subscriptions: [],
        subscriptionRequests: [],
        supportCases: [],
        expectedDocuments: [],
        history: [],
      };
    }

    const managerProfile = household.members.find((member) => member.relationship === "SELF") ?? household.members[0];

    return {
      ...this.formatManagementDetailFromMember(managerProfile, household),
      id: `user:${user.id}`,
      sourceId: user.id,
      recordType: "ACCOUNT",
      identity: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        type: "MANAGER",
      },
    };
  }

  async findFamilyRecords() {
    return this.prismaService.household.findMany({
      include: {
        owner: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
        members: {
          orderBy: { createdAt: "asc" },
          include: {
            profileDetail: true,
            subscriptions: {
              orderBy: { updatedAt: "desc" },
            },
            subscriptionRequests: {
              orderBy: { createdAt: "desc" },
              include: {
                offer: true,
              },
            },
            supportCases: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        subscriptionRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            household: { include: { owner: true } },
            member: true,
            payerMember: true,
            offer: true,
            documents: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        supportCases: {
          orderBy: { createdAt: "desc" },
          include: {
            household: { include: { owner: true } },
            member: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findUserRecords() {
    return this.prismaService.user.findMany({
      include: {
        households: {
          include: {
            owner: true,
            activities: {
              orderBy: { createdAt: "desc" },
              take: 8,
            },
            notifications: {
              orderBy: { createdAt: "desc" },
              take: 8,
            },
            members: {
              orderBy: { createdAt: "asc" },
              include: {
                profileDetail: true,
                subscriptions: {
                  orderBy: { updatedAt: "desc" },
                },
                subscriptionRequests: {
                  orderBy: { createdAt: "desc" },
                  include: {
                    offer: true,
                    documents: {
                      orderBy: { createdAt: "asc" },
                    },
                  },
                },
                supportCases: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
            subscriptionRequests: {
              orderBy: { createdAt: "desc" },
              include: {
                household: { include: { owner: true } },
                member: true,
                payerMember: true,
                offer: true,
                documents: {
                  orderBy: { createdAt: "asc" },
                },
              },
            },
            supportCases: {
              orderBy: { createdAt: "desc" },
              include: {
                household: { include: { owner: true } },
                member: true,
              },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async findSubscriptionRequestRecords() {
    return this.prismaService.subscriptionRequest.findMany({
      include: {
        household: { include: { owner: true } },
        member: true,
        payerMember: true,
        offer: true,
        documents: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findSupportCaseRecords() {
    return this.prismaService.supportCase.findMany({
      include: {
        household: { include: { owner: true } },
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getDashboard() {
    const [families, requests, supportCases, profilesCount] = await Promise.all([
      this.findFamilyRecords(),
      this.findSubscriptionRequestRecords(),
      this.findSupportCaseRecords(),
      this.prismaService.householdMember.count(),
    ]);

    const openRequestStatuses = ["WAITING_DOCUMENTS", "UNDER_REVIEW", "PAYMENT_PENDING", "BLOCKED"];
    const recentActivity = [
      ...families.flatMap((family) =>
        family.activities.map((activity) => ({
          id: activity.id,
          type: "ACTIVITY",
          label: activity.label,
          familyId: family.id,
          customerNumber: this.customerNumber(family.id),
          createdAt: activity.createdAt.toISOString(),
        })),
      ),
      ...requests.slice(0, 4).map((request) => ({
        id: request.id,
        type: "SUBSCRIPTION_REQUEST",
        label: `Demande ${request.offer.name} - ${this.fullName(request.member)}`,
        familyId: request.householdId,
        customerNumber: this.customerNumber(request.householdId),
        createdAt: request.createdAt.toISOString(),
      })),
      ...supportCases.slice(0, 4).map((supportCase) => ({
        id: supportCase.id,
        type: "SUPPORT_CASE",
        label: supportCase.type === "LOST_PASS" ? "Passe perdu declare" : "Passe trouve signale",
        familyId: supportCase.householdId,
        customerNumber: supportCase.householdId ? this.customerNumber(supportCase.householdId) : null,
        createdAt: supportCase.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      stats: {
        familiesCount: families.length,
        profilesCount,
        openSubscriptionRequestsCount: requests.filter((request) => openRequestStatuses.includes(request.status)).length,
        lostPassesCount: supportCases.filter((supportCase) => supportCase.type === "LOST_PASS" && supportCase.status !== "RESOLVED").length,
        foundPassesCount: supportCases.filter((supportCase) => supportCase.type === "FOUND_PASS" && supportCase.status !== "RESOLVED").length,
        dossiersToReviewCount: requests.filter((request) => request.status === "UNDER_REVIEW" || request.status === "BLOCKED").length,
      },
      recentActivity,
      families: families.slice(0, 8).map((family) => this.formatFamilySummary(family)),
      subscriptionRequests: requests.slice(0, 8).map((request) => this.formatSubscriptionRequest(request)),
      supportCases: supportCases.slice(0, 8).map((supportCase) => this.formatSupportCase(supportCase)),
    };
  }

  async search(query = "") {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const [families, users] = await Promise.all([
      this.findFamilyRecords(),
      this.getUsers(),
    ]);

    const familyResults = families
      .filter((family) => {
        const searchable = [
          family.name,
          this.customerNumber(family.id),
          family.owner.firstName,
          family.owner.lastName,
          family.owner.email,
          family.owner.phone,
          ...family.members.flatMap((member) => [member.firstName, member.lastName, member.department ?? ""]),
          ...family.supportCases.map((supportCase) => supportCase.passNumberMasked ?? ""),
        ].join(" ").toLowerCase();

        return searchable.includes(normalizedQuery);
      })
      .slice(0, 10)
      .map((family) => ({
        ...this.formatFamilySummary(family),
        profiles: family.members.slice(0, 4).map((member) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          profileType: member.profileType,
        })),
      }));

    const userResults = users
      .filter((user) => {
        const searchable = [
          user.firstName,
          user.lastName,
          user.email,
          user.customerNumber ?? "",
          user.family?.name ?? "",
        ].join(" ").toLowerCase();

        return searchable.includes(normalizedQuery);
      })
      .slice(0, 10)
      .map((user) => ({
        ...user,
        profiles: [],
      }));

    return [...familyResults, ...userResults].slice(0, 12);
  }

  async getUsers() {
    const users = await this.findUserRecords();

    return users.flatMap((user) => {
      const household = user.households[0] ?? null;
      const accountRow = this.formatAdminUserFromAccount(user, household);

      if (!household) {
        return [accountRow];
      }

      return [
        accountRow,
        ...household.members
          .filter((member) => member.relationship !== "SELF")
          .map((member) => this.formatAdminUserFromMember(member, household)),
      ];
    });
  }

  async getUser(id: string) {
    const [recordType, sourceId] = id.split(":");
    const users = await this.findUserRecords();

    if (recordType === "user") {
      const user = users.find((candidate) => candidate.id === sourceId);

      if (!user) {
        throw new NotFoundException("Utilisateur introuvable.");
      }

      return this.formatManagementDetailFromAccount(user, user.households[0] ?? null);
    }

    if (recordType === "member") {
      for (const user of users) {
        for (const household of user.households) {
          const member = household.members.find((candidate) => candidate.id === sourceId);

          if (member) {
            return this.formatManagementDetailFromMember(member, household);
          }
        }
      }
    }

    throw new NotFoundException("Utilisateur introuvable.");
  }

  async getFamilies() {
    const families = await this.findFamilyRecords();
    return families.map((family) => this.formatFamilySummary(family));
  }

  async getFamily(id: string) {
    const family = (await this.findFamilyRecords()).find((candidate) => candidate.id === id);

    if (!family) {
      throw new NotFoundException("Famille introuvable.");
    }

    return this.formatFamilyDetail(family);
  }

  async getSubscriptionRequests() {
    const requests = await this.findSubscriptionRequestRecords();
    return requests.map((request) => this.formatSubscriptionRequest(request));
  }

  async updateSubscriptionRequest(id: string, data: UpdateAdminSubscriptionRequestDto) {
    const updated = await this.prismaService.subscriptionRequest.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        household: { include: { owner: true } },
        member: true,
        payerMember: true,
        offer: true,
        documents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await this.prismaService.householdActivity.create({
      data: {
        householdId: updated.householdId,
        memberId: updated.memberId,
        label: `Back-office : demande ${updated.offer.name} passée au statut ${data.status}.`,
      },
    });

    return this.formatSubscriptionRequest(updated);
  }

  async getSupportCases() {
    const supportCases = await this.findSupportCaseRecords();
    return supportCases.map((supportCase) => this.formatSupportCase(supportCase));
  }

  async updateSupportCase(id: string, data: UpdateAdminSupportCaseDto) {
    const updated = await this.prismaService.supportCase.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        household: { include: { owner: true } },
        member: true,
      },
    });

    if (updated.householdId) {
      await this.prismaService.householdActivity.create({
        data: {
          householdId: updated.householdId,
          memberId: updated.memberId,
          label: `Back-office : dossier support ${updated.type} passé au statut ${data.status}.`,
        },
      });
    }

    return this.formatSupportCase(updated);
  }

  async getSosNavigoDashboard() {
    const supportCases = await this.findSupportCaseRecords();
    const lostPassCases = supportCases.filter((supportCase) => supportCase.type === "LOST_PASS");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closedCases = lostPassCases.filter((supportCase) => this.isSosClosed(supportCase.status));
    const foundToday = supportCases.filter((supportCase) => {
      const candidateDate = supportCase.foundAt ?? supportCase.createdAt;
      return supportCase.type === "FOUND_PASS" || supportCase.status === "PASS_FOUND_WAITING_PICKUP"
        ? candidateDate >= today
        : false;
    });
    const delays = closedCases
      .map((supportCase) => {
        const endDate = supportCase.resolvedAt ?? supportCase.finalChoiceAt ?? supportCase.pickedUpAt ?? supportCase.updatedAt;
        return Math.max(0, endDate.getTime() - supportCase.createdAt.getTime());
      })
      .filter((delay) => delay > 0);
    const averageDelayHours = delays.length
      ? Math.round((delays.reduce((sum, delay) => sum + delay, 0) / delays.length / 3_600_000) * 10) / 10
      : 0;

    return {
      stats: {
        totalCases: supportCases.length,
        activeCases: lostPassCases.filter((supportCase) => !this.isSosClosed(supportCase.status)).length,
        foundTodayCount: foundToday.length,
        waitingPickupCount: supportCases.filter((supportCase) => supportCase.status === "PASS_FOUND_WAITING_PICKUP").length,
        transferToPhoneCount: lostPassCases.filter((supportCase) => supportCase.chosenResolution === "TRANSFER_TO_PHONE").length,
        deactivationCount: lostPassCases.filter((supportCase) => supportCase.chosenResolution === "DEACTIVATE_ONLY").length,
        closedCasesCount: closedCases.length,
        resolutionRate: lostPassCases.length ? Math.round((closedCases.length / lostPassCases.length) * 100) : 0,
        averageDelayHours,
      },
      desks: SOS_DESKS,
      recentCases: supportCases.slice(0, 8).map((supportCase) => this.formatSupportCase(supportCase)),
    };
  }

  async getSosNavigoCases(filter = "all", query = "") {
    const normalizedQuery = query.trim().toLowerCase();
    const supportCases = await this.findSupportCaseRecords();

    return supportCases
      .filter((supportCase) => {
        if (filter === "active" && this.isSosClosed(supportCase.status)) {
          return false;
        }

        if (filter === "transfer" && supportCase.chosenResolution !== "TRANSFER_TO_PHONE") {
          return false;
        }

        if (filter === "deactivation" && supportCase.chosenResolution !== "DEACTIVATE_ONLY") {
          return false;
        }

        if (filter === "found" && supportCase.type !== "FOUND_PASS" && !supportCase.foundAt) {
          return false;
        }

        if (filter === "waiting-pickup" && supportCase.status !== "PASS_FOUND_WAITING_PICKUP") {
          return false;
        }

        if (filter === "closed" && !this.isSosClosed(supportCase.status)) {
          return false;
        }

        if (filter === "cancelled" && supportCase.status !== "CANCELLED_BY_USER") {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          this.dossierNumber(supportCase),
          supportCase.type,
          supportCase.status,
          supportCase.reason ?? "",
          supportCase.chosenResolution ?? "",
          supportCase.passNumberMasked ?? "",
          supportCase.foundDeskName ?? "",
          supportCase.household ? this.customerNumber(supportCase.household.id) : "",
          supportCase.household?.name ?? "",
          supportCase.household?.owner?.email ?? "",
          supportCase.member?.firstName ?? "",
          supportCase.member?.lastName ?? "",
        ].join(" ").toLowerCase();

        return searchable.includes(normalizedQuery);
      })
      .map((supportCase) => this.formatSupportCase(supportCase));
  }

  async getSosNavigoCase(id: string) {
    const supportCase = (await this.findSupportCaseRecords()).find((candidate) => candidate.id === id);

    if (!supportCase) {
      throw new NotFoundException("Dossier SOS Navigo introuvable.");
    }

    return this.formatSupportCase(supportCase);
  }

  async registerFoundPass(data: CreateAdminFoundPassDto) {
    const passNumberMasked = this.maskPassNumber(data.passNumber);
    const desk = this.pickDesk(data.deskName);
    const foundAt = new Date();
    const activeLostCases = await this.prismaService.supportCase.findMany({
      where: {
        type: "LOST_PASS",
        status: {
          notIn: [
            "RESOLVED",
            "CANCELLED_BY_USER",
            "PASS_PICKED_UP",
            "DIGITAL_SUPPORT_CONFIRMED",
            "PHYSICAL_PASS_REACTIVATION_REQUESTED",
          ],
        },
      },
      include: {
        household: { include: { owner: true } },
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const normalizedPassNumber = this.normalizePassNumber(passNumberMasked);
    const matchedCase = activeLostCases.find(
      (supportCase) => this.normalizePassNumber(supportCase.passNumberMasked) === normalizedPassNumber,
    );

    if (matchedCase) {
      const updated = await this.prismaService.supportCase.update({
        where: { id: matchedCase.id },
        data: {
          status: "PASS_FOUND_WAITING_PICKUP",
          foundLocation: desk.name,
          foundDeskName: desk.name,
          foundDeskAddress: desk.address,
          foundAt,
          depositedAtDesk: true,
        },
        include: {
          household: { include: { owner: true } },
          member: {
            include: {
              subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
            },
          },
        },
      });

      if (updated.householdId) {
        await this.prismaService.householdActivity.create({
          data: {
            householdId: updated.householdId,
            memberId: updated.memberId,
            label: `SOS Navigo : pass retrouve au guichet ${desk.name}.`,
          },
        });
      }

      return {
        matched: true,
        supportCase: this.formatSupportCase(updated),
      };
    }

    const created = await this.prismaService.supportCase.create({
      data: {
        type: "FOUND_PASS",
        status: "OPEN",
        passNumberMasked,
        foundLocation: desk.name,
        foundDeskName: desk.name,
        foundDeskAddress: desk.address,
        foundAt,
        depositedAtDesk: true,
        description: `Pass retrouve au guichet ${desk.name}.`,
      },
      include: {
        household: { include: { owner: true } },
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    return {
      matched: false,
      supportCase: this.formatSupportCase(created),
    };
  }

  async notifySosNavigoCase(id: string) {
    const updated = await this.prismaService.supportCase.update({
      where: { id },
      data: {
        clientNotifiedAt: new Date(),
      },
      include: {
        household: { include: { owner: true } },
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (updated.householdId) {
      await Promise.all([
        this.prismaService.familyNotification.create({
          data: {
            householdId: updated.householdId,
            memberId: updated.memberId,
            type: "SUPPORT_UPDATE",
            severity: "SUCCESS",
            title: "Pass Navigo retrouve",
            message: `${updated.member ? this.fullName(updated.member) : "Un membre du foyer"} peut recuperer son pass au guichet ${updated.foundDeskName ?? updated.foundLocation ?? "indique"}.`,
          },
        }),
        this.prismaService.householdActivity.create({
          data: {
            householdId: updated.householdId,
            memberId: updated.memberId,
            label: "SOS Navigo : client notifie de la disponibilite du pass.",
          },
        }),
      ]);
    }

    return this.formatSupportCase(updated);
  }

  async updateSosNavigoCaseStatus(id: string, data: UpdateAdminSosCaseStatusDto) {
    const patch: Record<string, unknown> = {
      status: data.status,
    };

    if (data.status === "PASS_FOUND_WAITING_PICKUP") {
      const desk = this.pickDesk();
      patch.foundDeskName = desk.name;
      patch.foundDeskAddress = desk.address;
      patch.foundLocation = desk.name;
      patch.foundAt = new Date();
      patch.depositedAtDesk = true;
    }

    if (data.status === "PASS_PICKED_UP") {
      patch.pickedUpAt = new Date();
    }

    if (data.status === "RESOLVED") {
      patch.resolvedAt = new Date();
    }

    const updated = await this.prismaService.supportCase.update({
      where: { id },
      data: patch,
      include: {
        household: { include: { owner: true } },
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (updated.householdId) {
      await this.prismaService.householdActivity.create({
        data: {
          householdId: updated.householdId,
          memberId: updated.memberId,
          label: `SOS Navigo : dossier passe au statut ${data.status}.`,
        },
      });
    }

    return this.formatSupportCase(updated);
  }
}
