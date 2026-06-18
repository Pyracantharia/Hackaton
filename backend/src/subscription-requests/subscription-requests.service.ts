import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { DocumentType, SubscriptionRequestStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSubscriptionRequestDto } from "./dtos/create-subscription-request.dto";
import { CreateImagineRDraftDto, UpdateImagineRRequestDto } from "./dtos/imagine-r-subscription-request.dto";
import { UpdateSubscriptionRequestDto } from "./dtos/update-subscription-request.dto";

const OPEN_SUBSCRIPTION_REQUEST_STATUSES: SubscriptionRequestStatus[] = [
  "DRAFT",
  "WAITING_DOCUMENTS",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "BLOCKED",
];

@Injectable()
export class SubscriptionRequestsService {
  constructor(private readonly prismaService: PrismaService) {}

  private documentUploadDirectory = join(process.cwd(), "uploads", "subscription-documents");

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
    addresses: true,
  };

  private buildTimeline(status: string) {
    const steps = [
      { key: "CREATED", label: "Dossier créé" },
      { key: "DOCUMENTS", label: "Documents à préparer" },
      { key: "REVIEW", label: "Vérification du dossier" },
      { key: "PAYMENT", label: "Paiement à confirmer" },
      { key: "READY", label: "Titre en préparation" },
    ];

    if (status === "BLOCKED") {
      return steps.map((step, index) => ({
        ...step,
        status: index < 2 ? "DONE" : index === 2 ? "CURRENT" : "UPCOMING",
      }));
    }

    if (status === "REJECTED") {
      return steps.map((step, index) => ({
        ...step,
        status: index < 3 ? "DONE" : "UPCOMING",
      }));
    }

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

  private formatDate(date: Date | string | null | undefined) {
    return date ? new Date(date).toISOString() : null;
  }

  private isMonthlyRenewalProduct(productType?: string | null) {
    return productType === "NAVIGO_LIBERTE";
  }

  private getNextMonthlyRenewalDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private buildRenewalUpdate(
    enabled: boolean,
    productType?: string | null,
    nextDate?: Date | null,
    months?: number | null,
  ) {
    if (!enabled) {
      return {
        autoRenewalEnabled: false,
        renewalType: null,
        renewalStatus: "DISABLED" as const,
        renewalMonths: null,
        renewalMonthsRemaining: null,
        renewalNextDate: null,
        renewalActivatedAt: null,
        renewalCancelledAt: null,
      };
    }

    const isMonthly = this.isMonthlyRenewalProduct(productType);
    const renewalMonths = isMonthly ? Math.min(Math.max(months ?? 1, 1), 12) : null;

    return {
      autoRenewalEnabled: true,
      renewalType: isMonthly ? ("MONTHLY" as const) : ("ANNUAL" as const),
      renewalStatus: "ACTIVE" as const,
      renewalMonths,
      renewalMonthsRemaining: renewalMonths,
      renewalNextDate: isMonthly ? this.getNextMonthlyRenewalDate() : (nextDate ?? null),
      renewalActivatedAt: new Date(),
      renewalCancelledAt: null,
    };
  }

  private formatRenewal(request: any) {
    const enabled = Boolean(request.autoRenewalEnabled && request.renewalStatus === "ACTIVE");
    const type = request.renewalType ?? null;
    const status = request.renewalStatus ?? (enabled ? "ACTIVE" : "DISABLED");
    const monthsRemaining = request.renewalMonthsRemaining ?? null;

    return {
      enabled,
      type,
      status,
      months: request.renewalMonths ?? null,
      monthsRemaining,
      nextDate: this.formatDate(request.renewalNextDate),
      activatedAt: this.formatDate(request.renewalActivatedAt),
      cancelledAt: this.formatDate(request.renewalCancelledAt),
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

  private formatRequest(request: any) {
    const addresses = Object.fromEntries(
      (request.addresses ?? []).map((address: any) => [
        address.type.toLowerCase(),
        {
          id: address.id,
          street: address.street,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          addressLine3: address.addressLine3,
          postalCode: address.postalCode,
          city: address.city,
          country: address.country,
        },
      ]),
    );

    return {
      id: request.id,
      requestNumber: request.requestNumber,
      flowType: request.flowType,
      status: request.status,
      reviewedAt: this.formatDate(request.reviewedAt),
      rejectionReason: request.rejectionReason,
      paymentConfirmedAt: this.formatDate(request.paymentConfirmedAt),
      paymentCancelledAt: this.formatDate(request.paymentCancelledAt),
      stripeCheckoutSessionId: request.stripeCheckoutSessionId,
      autoRenewalEnabled: request.autoRenewalEnabled,
      renewal: this.formatRenewal(request),
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
        simulatedFileName: document.simulatedFileName,
        simulatedMimeType: document.simulatedMimeType,
        simulatedSizeBytes: document.simulatedSizeBytes,
        hasStoredFile: Boolean(document.storedFilePath),
        uploadedAt: this.formatDate(document.uploadedAt),
      })),
      imagineR:
        request.flowType === "IMAGINE_R"
          ? {
              hasPreviousImagineR: request.hasPreviousImagineR,
              hasCustomerNumber: request.hasCustomerNumber,
              customerNumber: request.customerNumber,
              infoCertificationAccepted: request.infoCertificationAccepted,
              holderAddressSameAsPayer: request.holderAddressSameAsPayer,
              payerBirthDate: this.formatDate(request.payerBirthDate),
              schoolZipOrCity: request.schoolZipOrCity,
              schoolName: request.schoolName,
              schoolLevel: request.imagineRSchoolLevel,
              scholarshipStatus: request.scholarshipStatus,
              forfaitStartDate: this.formatDate(request.forfaitStartDate),
              validityStartDate: this.formatDate(request.validityStartDate),
              validityEndDate: this.formatDate(request.validityEndDate),
              deliveryMode: request.deliveryMode,
              baseAmountCents: request.baseAmountCents,
              feeAmountCents: request.feeAmountCents,
              totalAmountCents: request.totalAmountCents,
              currency: request.currency,
              signatureInformationAccepted: request.signatureInformationAccepted,
              signaturePayerAccepted: request.signaturePayerAccepted,
              signatureTermsAccepted: request.signatureTermsAccepted,
              signatureDocumentsAccepted: request.signatureDocumentsAccepted,
              signedAt: this.formatDate(request.signedAt),
              paymentSimulatedAt: this.formatDate(request.paymentSimulatedAt),
              submittedAt: this.formatDate(request.submittedAt),
              addresses,
            }
          : null,
      timeline: this.buildTimeline(request.status),
    };
  }

  private isImagineROffer(productType: string) {
    return productType === "IMAGINE_R_JUNIOR" || productType === "IMAGINE_R_SCHOOL";
  }

  private buildImagineRAmounts(productType: string) {
    const baseAmountCents = productType === "IMAGINE_R_JUNIOR" ? 1720 : 39330;
    const feeAmountCents = 800;

    return {
      baseAmountCents,
      feeAmountCents,
      totalAmountCents: baseAmountCents + feeAmountCents,
    };
  }

  private buildImagineRRequiredDocuments(productType: string, documents: Array<{ documentType: DocumentType; label: string }>) {
    const documentMap = new Map(documents.map((document) => [document.documentType, document.label]));

    documentMap.set("PHOTO", documentMap.get("PHOTO") ?? "Photo du titulaire");
    documentMap.set("ID_DOCUMENT", documentMap.get("ID_DOCUMENT") ?? "Justificatif d'identité");

    if (productType === "IMAGINE_R_SCHOOL") {
      documentMap.set("SCHOOL_CERTIFICATE", documentMap.get("SCHOOL_CERTIFICATE") ?? "Certificat scolaire");
    }

    return Array.from(documentMap.entries()).map(([documentType, label]) => ({ documentType, label }));
  }

  private buildRequestNumber(prefix = "IR") {
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
  }

  private extensionFromMimeType(mimeType?: string | null) {
    if (mimeType === "image/jpeg") return ".jpg";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/gif") return ".gif";
    if (mimeType === "application/pdf") return ".pdf";
    return null;
  }

  private async storeDocumentFile(dataUrl?: string | null, fileName?: string | null, mimeType?: string | null) {
    if (!dataUrl) {
      return null;
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
      throw new BadRequestException("Le fichier justificatif transmis est invalide.");
    }

    const contentType = mimeType ?? match[1];
    const extension = this.extensionFromMimeType(contentType) ?? (extname(fileName ?? "") || ".bin");
    const storedFileName = `${randomUUID()}${extension}`;

    await mkdir(this.documentUploadDirectory, { recursive: true });
    await writeFile(join(this.documentUploadDirectory, storedFileName), Buffer.from(match[2], "base64"));

    return storedFileName;
  }

  private async storeDocumentBuffer(buffer: Buffer, fileName?: string | null, mimeType?: string | null) {
    const extension = this.extensionFromMimeType(mimeType) ?? (extname(fileName ?? "") || ".bin");
    const storedFileName = `${randomUUID()}${extension}`;

    await mkdir(this.documentUploadDirectory, { recursive: true });
    await writeFile(join(this.documentUploadDirectory, storedFileName), buffer);

    return storedFileName;
  }

  private defaultImagineRDates() {
    return {
      forfaitStartDate: new Date("2026-09-01T00:00:00.000Z"),
      validityStartDate: new Date("2026-09-01T00:00:00.000Z"),
      validityEndDate: new Date("2027-09-30T00:00:00.000Z"),
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

  private async findActiveSubscriptionForMember(memberId: string) {
    return this.prismaService.subscription.findFirst({
      where: {
        householdMemberId: memberId,
        status: "ACTIVE",
      },
    });
  }

  private async findOpenRequestForMember(memberId: string, excludeRequestId?: string) {
    return this.prismaService.subscriptionRequest.findFirst({
      where: {
        memberId,
        status: { in: OPEN_SUBSCRIPTION_REQUEST_STATUSES },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
      include: this.requestInclude,
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });
  }

  private async ensureRequestCanBeCreated(memberId: string, offerId: string) {
    const activeSubscription = await this.findActiveSubscriptionForMember(memberId);

    if (activeSubscription) {
      throw new ConflictException({
        code: "ACTIVE_TITLE_EXISTS",
        message: "Ce profil possède déjà un titre actif.",
        existingTitleId: activeSubscription.id,
        existingTitleStatus: activeSubscription.status,
      });
    }

    const openRequest = await this.findOpenRequestForMember(memberId);

    if (!openRequest) {
      return null;
    }

    if (openRequest.status === "DRAFT" && openRequest.offerId === offerId) {
      return openRequest;
    }

    throw new ConflictException({
      code: "OPEN_REQUEST_EXISTS",
      message: "Une demande est déjà en cours pour ce profil.",
      existingRequestId: openRequest.id,
      existingRequestStatus: openRequest.status,
    });
  }

  private async ensureImagineRCanBeSubmitted(memberId: string, currentRequestId: string) {
    const activeSubscription = await this.findActiveSubscriptionForMember(memberId);

    if (activeSubscription) {
      throw new ConflictException({
        code: "ACTIVE_TITLE_EXISTS",
        message: "Ce profil possède déjà un titre actif.",
        existingTitleId: activeSubscription.id,
        existingTitleStatus: activeSubscription.status,
      });
    }

    const otherOpenRequest = await this.findOpenRequestForMember(memberId, currentRequestId);

    if (otherOpenRequest) {
      throw new ConflictException({
        code: "OPEN_REQUEST_EXISTS",
        message: "Une autre demande est déjà en cours pour ce profil.",
        existingRequestId: otherOpenRequest.id,
        existingRequestStatus: otherOpenRequest.status,
      });
    }
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

    const existingDraft = await this.ensureRequestCanBeCreated(member.id, offer.id);

    if (existingDraft) {
      return this.formatRequest(existingDraft);
    }

    const created = await this.prismaService.$transaction(async (tx) => {
      const request = await tx.subscriptionRequest.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          payerMemberId: payer.id,
          offerId: offer.id,
          status: "WAITING_DOCUMENTS",
          ...this.buildRenewalUpdate(data.autoRenewalEnabled, offer.productType, null, data.renewalMonths),
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

  async createImagineRDraftForUser(userId: string, data: CreateImagineRDraftDto) {
    const household = await this.findHouseholdForUser(userId);
    const member = household.members.find((candidate) => candidate.id === data.householdMemberId);

    if (!member) {
      throw new BadRequestException("Ce profil n'appartient pas à votre foyer.");
    }

    if (member.profileType !== "YOUNG") {
      throw new BadRequestException("Le parcours imagine R est réservé aux profils enfant / jeune.");
    }

    const payer = data.payerMemberId
      ? household.members.find((candidate) => candidate.id === data.payerMemberId)
      : household.members.find((candidate) => candidate.isPayer) ?? household.members[0];

    if (!payer) {
      throw new BadRequestException("Aucun payeur disponible pour ce foyer.");
    }

    const offer = await this.prismaService.productOffer.findUnique({
      where: { id: data.offerId },
      include: { requiredDocuments: { orderBy: { order: "asc" } } },
    });

    if (!offer || !offer.isActive || !this.isImagineROffer(offer.productType)) {
      throw new BadRequestException("Cette offre n'est pas compatible avec le parcours imagine R.");
    }

    const existingDraft = await this.ensureRequestCanBeCreated(member.id, offer.id);

    if (existingDraft) {
      return this.formatRequest(existingDraft);
    }

    const requiredDocuments = this.buildImagineRRequiredDocuments(offer.productType, offer.requiredDocuments);

    const created = await this.prismaService.subscriptionRequest.create({
      data: {
        householdId: household.id,
        memberId: member.id,
        payerMemberId: payer.id,
        offerId: offer.id,
        requestNumber: this.buildRequestNumber(),
        flowType: "IMAGINE_R",
        status: "DRAFT",
        intelligentDossierEnabled: true,
        autoRenewalEnabled: false,
        renewalStatus: "DISABLED",
        deliveryMode: "PAYER_HOME",
        scholarshipStatus: "UNKNOWN",
        holderAddressSameAsPayer: true,
        ...this.defaultImagineRDates(),
        ...this.buildImagineRAmounts(offer.productType),
        documents: {
          create: requiredDocuments.map((document) => ({
            documentType: document.documentType,
            label: document.label,
            status: "MISSING",
          })),
        },
      },
      include: this.requestInclude,
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

  async updateImagineRForUser(userId: string, id: string, data: UpdateImagineRRequestDto) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        flowType: "IMAGINE_R",
        household: { ownerId: userId },
      },
      include: { documents: true, offer: true },
    });

    if (!existing) {
      throw new NotFoundException("Brouillon imagine R introuvable.");
    }

    const allSignatureAccepted =
      data.signatureInformationAccepted === true &&
      data.signaturePayerAccepted === true &&
      data.signatureTermsAccepted === true &&
      data.signatureDocumentsAccepted === true;

    const updated = await this.prismaService.$transaction(async (tx) => {
      const request = await tx.subscriptionRequest.update({
        where: { id },
        data: {
          ...(typeof data.hasPreviousImagineR === "boolean" ? { hasPreviousImagineR: data.hasPreviousImagineR } : {}),
          ...(typeof data.hasCustomerNumber === "boolean" ? { hasCustomerNumber: data.hasCustomerNumber } : {}),
          ...(typeof data.customerNumber === "string" ? { customerNumber: data.customerNumber || null } : {}),
          ...(typeof data.infoCertificationAccepted === "boolean"
            ? { infoCertificationAccepted: data.infoCertificationAccepted }
            : {}),
          ...(typeof data.holderAddressSameAsPayer === "boolean"
            ? { holderAddressSameAsPayer: data.holderAddressSameAsPayer }
            : {}),
          ...(data.payerBirthDate ? { payerBirthDate: new Date(data.payerBirthDate) } : {}),
          ...(typeof data.schoolZipOrCity === "string" ? { schoolZipOrCity: data.schoolZipOrCity || null } : {}),
          ...(typeof data.schoolName === "string" ? { schoolName: data.schoolName || null } : {}),
          ...(data.imagineRSchoolLevel ? { imagineRSchoolLevel: data.imagineRSchoolLevel } : {}),
          ...(data.scholarshipStatus ? { scholarshipStatus: data.scholarshipStatus } : {}),
          ...(typeof data.autoRenewalEnabled === "boolean"
            ? this.buildRenewalUpdate(
                data.autoRenewalEnabled,
                existing.offer.productType,
                existing.validityEndDate ?? this.defaultImagineRDates().validityEndDate,
              )
            : {}),
          ...(typeof data.intelligentDossierEnabled === "boolean"
            ? { intelligentDossierEnabled: data.intelligentDossierEnabled }
            : {}),
          ...(typeof data.signatureInformationAccepted === "boolean"
            ? { signatureInformationAccepted: data.signatureInformationAccepted }
            : {}),
          ...(typeof data.signaturePayerAccepted === "boolean" ? { signaturePayerAccepted: data.signaturePayerAccepted } : {}),
          ...(typeof data.signatureTermsAccepted === "boolean" ? { signatureTermsAccepted: data.signatureTermsAccepted } : {}),
          ...(typeof data.signatureDocumentsAccepted === "boolean"
            ? { signatureDocumentsAccepted: data.signatureDocumentsAccepted }
            : {}),
          ...(allSignatureAccepted ? { signedAt: new Date() } : {}),
        },
      });

      for (const address of data.addresses ?? []) {
        await tx.subscriptionRequestAddress.upsert({
          where: {
            subscriptionRequestId_type: {
              subscriptionRequestId: id,
              type: address.type,
            },
          },
          create: {
            subscriptionRequestId: id,
            type: address.type,
            street: address.street,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            addressLine3: address.addressLine3,
            postalCode: address.postalCode,
            city: address.city,
            country: address.country ?? "France",
          },
          update: {
            street: address.street,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            addressLine3: address.addressLine3,
            postalCode: address.postalCode,
            city: address.city,
            country: address.country ?? "France",
          },
        });
      }

      for (const document of data.documents ?? []) {
        const existingDocument = existing.documents.find((candidate) => candidate.documentType === document.documentType);
        const storedFilePath = await this.storeDocumentFile(
          document.simulatedPreviewDataUrl,
          document.simulatedFileName,
          document.simulatedMimeType,
        );

        if (existingDocument) {
          await tx.subscriptionDocument.update({
            where: { id: existingDocument.id },
            data: {
              label: document.label ?? existingDocument.label,
              status: "UPLOADED",
              simulatedFileName: document.simulatedFileName,
              simulatedMimeType: document.simulatedMimeType,
              simulatedSizeBytes: document.simulatedSizeBytes,
              simulatedPreviewDataUrl: null,
              ...(storedFilePath ? { storedFilePath } : {}),
              uploadedAt: new Date(),
            },
          });
        } else {
          await tx.subscriptionDocument.create({
            data: {
              subscriptionRequestId: id,
              documentType: document.documentType,
              label: document.label ?? "Document justificatif",
              status: "UPLOADED",
              simulatedFileName: document.simulatedFileName,
              simulatedMimeType: document.simulatedMimeType,
              simulatedSizeBytes: document.simulatedSizeBytes,
              simulatedPreviewDataUrl: null,
              storedFilePath,
              uploadedAt: new Date(),
            },
          });
        }
      }

      return tx.subscriptionRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: this.requestInclude,
      });
    });

    return this.formatRequest(updated);
  }

  async uploadImagineRDocumentFileForUser(userId: string, id: string, documentType: string, file: any) {
    if (!file?.buffer) {
      throw new BadRequestException("Aucun fichier justificatif reçu.");
    }

    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        flowType: "IMAGINE_R",
        household: { ownerId: userId },
      },
      include: {
        documents: true,
        offer: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Demande imagine R introuvable.");
    }

    const document = existing.documents.find((candidate) => candidate.documentType === documentType);

    if (!document) {
      throw new NotFoundException("Justificatif introuvable.");
    }

    const storedFilePath = await this.storeDocumentBuffer(file.buffer, file.originalname, file.mimetype);

    const updated = await this.prismaService.subscriptionDocument.update({
      where: { id: document.id },
      data: {
        status: "UPLOADED",
        simulatedFileName: file.originalname,
        simulatedMimeType: file.mimetype,
        simulatedSizeBytes: file.size,
        simulatedPreviewDataUrl: null,
        storedFilePath,
        uploadedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      documentType: updated.documentType,
      label: updated.label,
      status: updated.status,
      simulatedFileName: updated.simulatedFileName,
      simulatedMimeType: updated.simulatedMimeType,
      simulatedSizeBytes: updated.simulatedSizeBytes,
      hasStoredFile: Boolean(updated.storedFilePath),
      uploadedAt: this.formatDate(updated.uploadedAt),
    };
  }

  async deleteImagineRDocumentFileForUser(userId: string, id: string, documentType: string) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        flowType: "IMAGINE_R",
        household: { ownerId: userId },
      },
      include: {
        documents: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Demande imagine R introuvable.");
    }

    const document = existing.documents.find((candidate) => candidate.documentType === documentType);

    if (!document) {
      throw new NotFoundException("Justificatif introuvable.");
    }

    if (document.storedFilePath && !document.storedFilePath.includes("/") && !document.storedFilePath.includes("\\")) {
      await unlink(join(this.documentUploadDirectory, document.storedFilePath)).catch(() => undefined);
    }

    const updated = await this.prismaService.subscriptionDocument.update({
      where: { id: document.id },
      data: {
        status: "MISSING",
        rejectionReason: null,
        simulatedFileName: null,
        simulatedMimeType: null,
        simulatedSizeBytes: null,
        simulatedPreviewDataUrl: null,
        storedFilePath: null,
        uploadedAt: null,
      },
    });

    return {
      id: updated.id,
      documentType: updated.documentType,
      label: updated.label,
      status: updated.status,
      simulatedFileName: updated.simulatedFileName,
      simulatedMimeType: updated.simulatedMimeType,
      simulatedSizeBytes: updated.simulatedSizeBytes,
      hasStoredFile: false,
      uploadedAt: this.formatDate(updated.uploadedAt),
    };
  }

  async submitImagineRForUser(userId: string, id: string) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        flowType: "IMAGINE_R",
        household: { ownerId: userId },
      },
      include: {
        household: true,
        member: true,
        offer: true,
        documents: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Demande imagine R introuvable.");
    }

    if (!existing.infoCertificationAccepted) {
      throw new BadRequestException("La certification avant souscription doit être acceptée.");
    }

    if (
      !existing.signatureInformationAccepted ||
      !existing.signaturePayerAccepted ||
      !existing.signatureTermsAccepted ||
      !existing.signatureDocumentsAccepted
    ) {
      throw new BadRequestException("Les confirmations de signature sont nécessaires.");
    }

    if (!existing.paymentConfirmedAt) {
      throw new BadRequestException("Le paiement doit être confirmé avant l'envoi du dossier.");
    }
    await this.ensureImagineRCanBeSubmitted(existing.memberId, existing.id);

    const updated = await this.prismaService.$transaction(async (tx) => {
      await tx.subscriptionDocument.updateMany({
        where: {
          subscriptionRequestId: id,
          status: "UPLOADED",
        },
        data: {
          status: "UNDER_REVIEW",
        },
      });

      const request = await tx.subscriptionRequest.update({
        where: { id },
        data: {
          status: "UNDER_REVIEW",
          paymentSimulatedAt: new Date(),
          submittedAt: new Date(),
        },
        include: this.requestInclude,
      });

      await tx.familyNotification.create({
        data: {
          householdId: existing.householdId,
          memberId: existing.memberId,
          type: "RENEWAL",
          severity: "SUCCESS",
          title: `${existing.member.firstName} — dossier imagine R envoyé`,
          message: "La demande est enregistrée. Les justificatifs vont être vérifiés par nos équipes.",
        },
      });

      await tx.householdActivity.create({
        data: {
          householdId: existing.householdId,
          memberId: existing.memberId,
          label: `Demande ${existing.offer.name} envoyée pour ${existing.member.firstName}.`,
        },
      });

      return request;
    });

    return this.formatRequest(updated);
  }

  async updateForUser(userId: string, id: string, data: UpdateSubscriptionRequestDto) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: {
        id,
        household: { ownerId: userId },
      },
      include: { offer: true },
    });

    if (!existing) {
      throw new NotFoundException("Demande de souscription introuvable.");
    }

    const updated = await this.prismaService.subscriptionRequest.update({
      where: { id },
      data: {
        ...(typeof data.autoRenewalEnabled === "boolean"
          ? this.buildRenewalUpdate(data.autoRenewalEnabled, existing.offer.productType, null, data.renewalMonths)
          : {}),
        ...(typeof data.intelligentDossierEnabled === "boolean"
          ? { intelligentDossierEnabled: data.intelligentDossierEnabled }
          : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: this.requestInclude,
    });

    return this.formatRequest(updated);
  }

  async cancelRenewalForUser(userId: string, id: string) {
    const existing = await this.prismaService.subscriptionRequest.findFirst({
      where: { id, household: { ownerId: userId } },
    });

    if (!existing) {
      throw new NotFoundException("Demande de souscription introuvable.");
    }

    const updated = await this.prismaService.subscriptionRequest.update({
      where: { id },
      data: {
        autoRenewalEnabled: false,
        renewalStatus: "CANCELLED",
        renewalCancelledAt: new Date(),
      },
      include: this.requestInclude,
    });

    return this.formatRequest(updated);
  }
}
