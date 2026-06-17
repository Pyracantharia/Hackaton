import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSubscriptionRequestDto } from "./dtos/create-subscription-request.dto";
import { UpdateSubscriptionRequestDto } from "./dtos/update-subscription-request.dto";

@Injectable()
export class SubscriptionRequestsService {
  constructor(private readonly prismaService: PrismaService) {}

  private requestInclude = {
    household: {
      include: {
        owner: true,
      },
    },
    member: true,
    payerMember: true,
    offer: {
      include: {
        benefits: { orderBy: { order: "asc" as const } },
        requiredDocuments: { orderBy: { order: "asc" as const } },
      },
    },
    documents: {
      orderBy: { createdAt: "asc" as const },
    },
  };

  private buildTimeline(status: string) {
    const steps = [
      { key: "CREATED", label: "Dossier créé" },
      { key: "DOCUMENTS", label: "Documents à préparer" },
      { key: "REVIEW", label: "Vérification du dossier" },
      { key: "PAYMENT", label: "Paiement à confirmer" },
      { key: "READY", label: "Titre en préparation" },
    ];

    const activeIndex =
      status === "ACTIVE"
        ? 4
        : status === "CONFIRMED" || status === "PAYMENT_PENDING"
          ? 3
          : status === "UNDER_REVIEW"
            ? 2
            : 1;

    return steps.map((step, index) => ({
      ...step,
      status: index < activeIndex ? "DONE" : index === activeIndex ? "CURRENT" : "UPCOMING",
    }));
  }

  private formatRequest(request: {
    id: string;
    status: string;
    autoRenewalEnabled: boolean;
    intelligentDossierEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    household: { id: string; name: string; owner: { firstName: string; lastName: string } };
    member: { id: string; firstName: string; lastName: string; profileType: string; relationship: string };
    payerMember: { id: string; firstName: string; lastName: string } | null;
    offer: {
      id: string;
      slug: string;
      name: string;
      productType: string;
      shortDescription: string;
      priceLabel: string;
      durationLabel: string;
      requiredDocuments: Array<{ id: string; documentType: string; label: string; required: boolean }>;
    };
    documents: Array<{ id: string; documentType: string; label: string; status: string; rejectionReason: string | null }>;
  }) {
    return {
      id: request.id,
      status: request.status,
      autoRenewalEnabled: request.autoRenewalEnabled,
      intelligentDossierEnabled: request.intelligentDossierEnabled,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      household: {
        id: request.household.id,
        name: request.household.name,
      },
      member: {
        id: request.member.id,
        firstName: request.member.firstName,
        lastName: request.member.lastName,
        profileType: request.member.profileType,
        relationship: request.member.relationship,
      },
      payer: request.payerMember
        ? {
            id: request.payerMember.id,
            firstName: request.payerMember.firstName,
            lastName: request.payerMember.lastName,
          }
        : {
            id: request.member.id,
            firstName: request.household.owner.firstName,
            lastName: request.household.owner.lastName,
          },
      offer: {
        id: request.offer.id,
        slug: request.offer.slug,
        name: request.offer.name,
        productType: request.offer.productType,
        shortDescription: request.offer.shortDescription,
        priceLabel: request.offer.priceLabel,
        durationLabel: request.offer.durationLabel,
      },
      documents: request.documents.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        label: document.label,
        status: document.status,
        rejectionReason: document.rejectionReason,
      })),
      timeline: this.buildTimeline(request.status),
    };
  }

  private async findHouseholdForUser(userId: string) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: {
        members: true,
      },
    });

    if (!household) {
      throw new NotFoundException("Aucun espace famille trouvé.");
    }

    return household;
  }

  async createForUser(userId: string, data: CreateSubscriptionRequestDto) {
    const household = await this.findHouseholdForUser(userId);
    const member = household.members.find((candidate) => candidate.id === data.householdMemberId);

    if (!member) {
      throw new BadRequestException("Ce profil n'appartient pas à votre foyer.");
    }

    const payer = data.payerMemberId
      ? household.members.find((candidate) => candidate.id === data.payerMemberId)
      : household.members.find((candidate) => candidate.isPayer) ?? household.members[0];

    if (!payer) {
      throw new BadRequestException("Aucun payeur disponible pour ce foyer.");
    }

    if (data.payerMemberId && payer.id !== data.payerMemberId) {
      throw new BadRequestException("Le payeur sélectionné n'appartient pas à votre foyer.");
    }

    const offer = await this.prismaService.productOffer.findUnique({
      where: { id: data.offerId },
      include: {
        requiredDocuments: { orderBy: { order: "asc" } },
      },
    });

    if (!offer || !offer.isActive) {
      throw new NotFoundException("Offre introuvable.");
    }

    const created = await this.prismaService.$transaction(async (tx) => {
      const request = await tx.subscriptionRequest.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          payerMemberId: payer.id,
          offerId: offer.id,
          status: "WAITING_DOCUMENTS",
          autoRenewalEnabled: data.autoRenewalEnabled,
          intelligentDossierEnabled: data.intelligentDossierEnabled,
          documents: {
            create: offer.requiredDocuments.map((document) => ({
              documentType: document.documentType,
              label: document.label,
              status: data.intelligentDossierEnabled ? "READY" : "MISSING",
            })),
          },
        },
        include: this.requestInclude,
      });

      await tx.familyNotification.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          type: "SUPPORT_UPDATE",
          severity: "SUCCESS",
          title: `${member.firstName} — demande enregistrée`,
          message: `La demande ${offer.name} est créée. Les documents peuvent maintenant être préparés.`,
        },
      });

      await tx.householdActivity.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          label: `Demande de souscription ${offer.name} créée pour ${member.firstName}.`,
        },
      });

      return request;
    });

    return this.formatRequest(created);
  }

  async getForUser(userId: string, id: string) {
    const request = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        household: { ownerId: userId },
      },
      include: this.requestInclude,
    });

    if (!request) {
      throw new NotFoundException("Demande de souscription introuvable.");
    }

    return this.formatRequest(request);
  }

  async updateForUser(userId: string, id: string, data: UpdateSubscriptionRequestDto) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        household: { ownerId: userId },
      },
    });

    if (!existing) {
      throw new NotFoundException("Demande de souscription introuvable.");
    }

    const updated = await this.prismaService.subscriptionRequest.update({
      where: { id },
      data: {
        ...(typeof data.autoRenewalEnabled === "boolean" ? { autoRenewalEnabled: data.autoRenewalEnabled } : {}),
        ...(typeof data.intelligentDossierEnabled === "boolean"
          ? { intelligentDossierEnabled: data.intelligentDossierEnabled }
          : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: this.requestInclude,
    });

    return this.formatRequest(updated);
  }
}
