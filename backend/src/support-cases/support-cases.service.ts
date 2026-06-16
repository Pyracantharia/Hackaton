import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateFoundPassDto } from "./dtos/create-found-pass.dto";
import { CreateLostPassDto } from "./dtos/create-lost-pass.dto";

@Injectable()
export class SupportCasesService {
  constructor(private readonly prismaService: PrismaService) {}

  private maskPassNumber(passNumber: string) {
    const sanitized = passNumber.replace(/\s+/g, "");
    const visiblePart = sanitized.slice(-4);
    return `${"*".repeat(Math.max(0, sanitized.length - 4))}${visiblePart}`;
  }

  async createLostPassCase(userId: string, data: CreateLostPassDto) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: {
        members: true,
      },
    });

    if (!household) {
      throw new NotFoundException("Aucun espace famille trouve pour cet utilisateur.");
    }

    const member = household.members.find((candidate) => candidate.id === data.memberId);

    if (!member) {
      throw new NotFoundException("Le profil selectionne est introuvable.");
    }

    const createdCase = await this.prismaService.$transaction(async (tx) => {
      const supportCase = await tx.supportCase.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          type: "LOST_PASS",
          status: "OPEN",
          description: data.reason,
        },
      });

      const latestSubscription = await tx.subscription.findFirst({
        where: { householdMemberId: member.id },
        orderBy: { updatedAt: "desc" },
      });

      if (latestSubscription) {
        await tx.subscription.update({
          where: { id: latestSubscription.id },
          data: {
            status: "LOST",
            nextActionLabel: "Suivre la demande de remplacement",
          },
        });
      }

      await tx.familyNotification.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          type: "SUPPORT_UPDATE",
          severity: "WARNING",
          title: `${member.firstName} — Passe perdu declare`,
          message: "Demande de remplacement creee. Vous pouvez suivre le dossier depuis votre espace.",
        },
      });

      await tx.householdActivity.create({
        data: {
          householdId: household.id,
          memberId: member.id,
          label: `${member.firstName} a signale une perte de passe.`,
        },
      });

      return supportCase;
    });

    return {
      message: "Demande de remplacement creee.",
      supportCaseId: createdCase.id,
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
