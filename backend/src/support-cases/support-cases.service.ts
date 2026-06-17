import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  HouseholdMember,
  Subscription,
  SupportCase,
  SupportCaseResolution,
  SupportCaseStatus,
} from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateFoundPassDto } from "./dtos/create-found-pass.dto";
import { CreateLostPassDto } from "./dtos/create-lost-pass.dto";

type SupportCaseWithRelations = SupportCase & {
  member:
    | (HouseholdMember & { subscriptions?: Subscription[] })
    | null;
};

const CANCELLABLE_STATUSES: SupportCaseStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "TRANSFER_TO_PHONE_REQUESTED",
  "PASS_DEACTIVATION_REQUESTED",
];

@Injectable()
export class SupportCasesService {
  constructor(private readonly prismaService: PrismaService) {}

  private maskPassNumber(passNumber: string) {
    const sanitized = passNumber.replace(/\s+/g, "");
    const visiblePart = sanitized.slice(-4);
    return `${"*".repeat(Math.max(0, sanitized.length - 4))}${visiblePart}`;
  }

  // MVP : aucun vrai numero de pass n'est stocke. On derive un numero masque
  // stable et lisible a partir de l'id membre, uniquement pour l'affichage.
  private buildMaskedPassForMember(memberId: string) {
    let hash = 0;
    for (const char of memberId) {
      hash = (hash * 31 + char.charCodeAt(0)) % 100000;
    }
    const lastFour = (hash % 10000).toString().padStart(4, "0");
    return `**** ${lastFour}`;
  }

  // Numero de dossier affichable, ex : SOS-2026-0041
  private buildDossierNumber(supportCase: { id: string; createdAt: Date }) {
    const year = supportCase.createdAt.getFullYear();
    const segment = supportCase.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
    return `SOS-${year}-${segment}`;
  }

  private resolutionToStatus(resolution: SupportCaseResolution): SupportCaseStatus {
    return resolution === "TRANSFER_TO_PHONE"
      ? "TRANSFER_TO_PHONE_REQUESTED"
      : "PASS_DEACTIVATION_REQUESTED";
  }

  private statusLabel(status: SupportCaseStatus) {
    switch (status) {
      case "OPEN":
        return "Declaration recue";
      case "IN_PROGRESS":
        return "En cours de traitement";
      case "TRANSFER_TO_PHONE_REQUESTED":
        return "Transfert telephone demande";
      case "PASS_DEACTIVATION_REQUESTED":
        return "Desactivation demandee";
      case "RESOLVED":
        return "Demande traitee";
      case "CANCELLED_BY_USER":
        return "Annulee";
      default:
        return status;
    }
  }

  private nextStepLabel(status: SupportCaseStatus) {
    switch (status) {
      case "OPEN":
        return "Verification de votre demande par nos equipes.";
      case "IN_PROGRESS":
        return "Un agent traite votre demande.";
      case "TRANSFER_TO_PHONE_REQUESTED":
        return "Transfert du titre sur telephone en cours de preparation.";
      case "PASS_DEACTIVATION_REQUESTED":
        return "Desactivation du pass physique en cours de preparation.";
      case "RESOLVED":
        return "Votre demande a ete traitee.";
      case "CANCELLED_BY_USER":
        return "Vous avez annule cette declaration.";
      default:
        return "";
    }
  }

  private titleLabelForMember(member: SupportCaseWithRelations["member"]) {
    if (!member) {
      return null;
    }

    const latestSubscription = member.subscriptions?.[0];
    return latestSubscription?.productName ?? null;
  }

  private serializeSupportCase(supportCase: SupportCaseWithRelations) {
    return {
      id: supportCase.id,
      dossierNumber: this.buildDossierNumber(supportCase),
      type: supportCase.type,
      status: supportCase.status,
      statusLabel: this.statusLabel(supportCase.status),
      nextStep: this.nextStepLabel(supportCase.status),
      reason: supportCase.reason,
      chosenResolution: supportCase.chosenResolution,
      memberId: supportCase.memberId,
      memberName: supportCase.member
        ? `${supportCase.member.firstName} ${supportCase.member.lastName}`.trim()
        : null,
      titleLabel: this.titleLabelForMember(supportCase.member),
      passNumberMasked: supportCase.passNumberMasked,
      cancellable: CANCELLABLE_STATUSES.includes(supportCase.status),
      createdAt: supportCase.createdAt.toISOString(),
      updatedAt: supportCase.updatedAt.toISOString(),
      cancelledAt: supportCase.cancelledAt?.toISOString() ?? null,
      resolvedAt: supportCase.resolvedAt?.toISOString() ?? null,
    };
  }

  private async getHouseholdForUser(userId: string) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: { members: true },
    });

    if (!household) {
      throw new NotFoundException("Aucun espace famille trouve pour cet utilisateur.");
    }

    return household;
  }

  async createLostPassCase(userId: string, data: CreateLostPassDto) {
    if (data.understandsDeactivation !== true) {
      throw new BadRequestException(
        "Vous devez confirmer avoir compris que le pass physique pourra etre desactive.",
      );
    }

    const household = await this.getHouseholdForUser(userId);
    const member = household.members.find((candidate) => candidate.id === data.memberId);

    if (!member) {
      throw new NotFoundException("Le profil selectionne est introuvable.");
    }

    // On ne peut declarer une perte que si un titre est rattache au profil.
    const latestSubscription = await this.prismaService.subscription.findFirst({
      where: { householdMemberId: member.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!latestSubscription) {
      throw new BadRequestException(
        "Aucun pass actif n'est rattache a ce profil : la perte ne peut pas etre declaree.",
      );
    }

    // Une seule declaration de perte active a la fois par profil.
    const existingActiveCase = await this.prismaService.supportCase.findFirst({
      where: {
        memberId: member.id,
        type: "LOST_PASS",
        status: { notIn: ["RESOLVED", "CANCELLED_BY_USER"] },
      },
    });

    if (existingActiveCase) {
      throw new ConflictException(
        "Une declaration de perte est deja en cours pour ce profil.",
      );
    }

    const isTransfer = data.chosenResolution === "TRANSFER_TO_PHONE";
    // Le transfert sur telephone est effectue instantanement (MVP simule).
    // La desactivation seule reste une demande suivie et annulable.
    const status = isTransfer ? "RESOLVED" : "PASS_DEACTIVATION_REQUESTED";
    const passNumberMasked = this.buildMaskedPassForMember(member.id);

    const createdCase = await this.prismaService.$transaction(async (tx) => {
      const supportCase = await tx.supportCase.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          type: "LOST_PASS",
          status,
          reason: data.reason,
          chosenResolution: data.chosenResolution,
          passNumberMasked,
          description: `Declaration de perte (${data.reason}).`,
          resolvedAt: isTransfer ? new Date() : null,
        },
      });

      await tx.subscription.update({
        where: { id: latestSubscription.id },
        data: isTransfer
          ? {
              // Le titre reste valable, desormais disponible sur smartphone.
              status: "ACTIVE",
              nextActionLabel: "Titre disponible sur smartphone",
            }
          : {
              status: "LOST",
              nextActionLabel: "Suivre la demande de remplacement",
            },
      });

      await tx.familyNotification.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          type: "SUPPORT_UPDATE",
          severity: isTransfer ? "SUCCESS" : "WARNING",
          title: isTransfer
            ? `${member.firstName} — Titre transfere sur smartphone`
            : `${member.firstName} — Passe perdu declare`,
          message: isTransfer
            ? "Le transfert sur smartphone a ete effectue. Le pass physique est desactive."
            : "Demande enregistree. Vous pouvez suivre ou annuler le dossier depuis votre espace.",
        },
      });

      await tx.householdActivity.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          label: isTransfer
            ? `${member.firstName} a transfere son titre sur smartphone (passe perdu).`
            : `${member.firstName} a signale une perte de passe.`,
        },
      });

      return supportCase;
    });

    return {
      message: isTransfer
        ? "Le transfert sur votre smartphone a ete effectue. Votre pass physique est desactive."
        : "Votre declaration de perte a ete enregistree.",
      supportCase: {
        id: createdCase.id,
        type: createdCase.type,
        status: createdCase.status,
        dossierNumber: this.buildDossierNumber(createdCase),
      },
    };
  }

  async getMyCases(userId: string) {
    const household = await this.getHouseholdForUser(userId);

    const supportCases = await this.prismaService.supportCase.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    return {
      supportCases: supportCases.map((supportCase) => this.serializeSupportCase(supportCase)),
    };
  }

  async getCaseById(userId: string, supportCaseId: string) {
    const household = await this.getHouseholdForUser(userId);

    const supportCase = await this.prismaService.supportCase.findFirst({
      where: { id: supportCaseId, householdId: household.id },
      include: {
        member: {
          include: {
            subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!supportCase) {
      throw new NotFoundException("Cette declaration est introuvable.");
    }

    return this.serializeSupportCase(supportCase);
  }

  async cancelCase(userId: string, supportCaseId: string) {
    const household = await this.getHouseholdForUser(userId);

    const supportCase = await this.prismaService.supportCase.findFirst({
      where: { id: supportCaseId, householdId: household.id },
    });

    if (!supportCase) {
      throw new NotFoundException("Cette declaration est introuvable.");
    }

    if (!CANCELLABLE_STATUSES.includes(supportCase.status)) {
      throw new ConflictException(
        "Cette declaration ne peut plus etre annulee car elle a deja ete traitee ou annulee.",
      );
    }

    const updatedCase = await this.prismaService.$transaction(async (tx) => {
      const cancelled = await tx.supportCase.update({
        where: { id: supportCase.id },
        data: {
          status: "CANCELLED_BY_USER",
          cancelledAt: new Date(),
        },
      });

      if (supportCase.memberId) {
        const lostSubscription = await tx.subscription.findFirst({
          where: { householdMemberId: supportCase.memberId, status: "LOST" },
          orderBy: { updatedAt: "desc" },
        });

        if (lostSubscription) {
          await tx.subscription.update({
            where: { id: lostSubscription.id },
            data: {
              status: "ACTIVE",
              nextActionLabel: null,
            },
          });
        }

        await tx.familyNotification.create({
          data: {
            householdId: household.id,
            memberId: supportCase.memberId,
            type: "SUPPORT_UPDATE",
            severity: "SUCCESS",
            title: "Declaration de perte annulee",
            message:
              "La declaration a ete annulee. Votre pass reste utilisable si aucune desactivation n'a ete effectuee.",
          },
        });

        await tx.householdActivity.create({
          data: {
            householdId: household.id,
            memberId: supportCase.memberId,
            label: "Une declaration de perte a ete annulee (passe retrouve).",
          },
        });
      }

      return cancelled;
    });

    return {
      message:
        "La declaration a ete annulee. Votre pass reste utilisable si aucune desactivation n'a ete effectuee.",
      supportCase: {
        id: updatedCase.id,
        status: updatedCase.status,
      },
    };
  }

  async createFoundPassCase(data: CreateFoundPassDto) {
    const passNumberMasked = this.maskPassNumber(data.passNumber);
    const supportCase = await this.prismaService.supportCase.create({
      data: {
        type: "FOUND_PASS",
        status: "OPEN",
        passNumberMasked,
        foundLocation: data.foundLocation,
        depositedAtDesk: data.depositedAtDesk,
      },
    });

    return {
      message: "Signalement enregistre. Merci pour votre aide.",
      supportCaseId: supportCase.id,
      passNumberMasked,
    };
  }
}
