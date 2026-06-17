import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RecommendTitleDto } from "./dtos/recommend-title.dto";

@Injectable()
export class TitlesService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly offerInclude = {
    benefits: { orderBy: { order: "asc" as const } },
    requiredDocuments: { orderBy: { order: "asc" as const } },
  };

  private formatOffer(offer: {
    id: string;
    slug: string;
    name: string;
    productType: string;
    shortDescription: string;
    longDescription: string;
    priceLabel: string;
    durationLabel: string;
    targetProfile: string;
    minAge: number | null;
    maxAge: number | null;
    benefits: Array<{ id: string; label: string }>;
    requiredDocuments: Array<{ id: string; documentType: string; label: string; required: boolean }>;
  }) {
    return {
      id: offer.id,
      slug: offer.slug,
      name: offer.name,
      productType: offer.productType,
      shortDescription: offer.shortDescription,
      longDescription: offer.longDescription,
      priceLabel: offer.priceLabel,
      durationLabel: offer.durationLabel,
      targetProfile: offer.targetProfile,
      minAge: offer.minAge,
      maxAge: offer.maxAge,
      benefits: offer.benefits.map((benefit) => ({
        id: benefit.id,
        label: benefit.label,
      })),
      requiredDocuments: offer.requiredDocuments.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        label: document.label,
        required: document.required,
      })),
    };
  }

  private async findOfferBySlug(slug: string) {
    return this.prismaService.productOffer.findUnique({
      where: { slug },
      include: this.offerInclude,
    });
  }

  private calculateAge(birthDate: Date | null, fallback?: number) {
    if (typeof fallback === "number") {
      return fallback;
    }

    if (!birthDate) {
      return undefined;
    }

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDelta = now.getMonth() - birthDate.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }

  private selectOfferSlug(member: {
    profileType: "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";
    relationship: "SELF" | "CHILD" | "RELATIVE";
    schoolLevel: "PRIMARY" | "COLLEGE" | "LYCEE" | "HIGHER_EDUCATION" | "OTHER" | null;
    birthDate: Date | null;
  }, answers: RecommendTitleDto["answers"]) {
    const age = this.calculateAge(member.birthDate, answers.age);
    const schoolLevel = answers.schoolLevel ?? member.schoolLevel ?? undefined;

    if (answers.lifeSituation === "STUDENT" || schoolLevel === "HIGHER_EDUCATION") {
      return {
        slug: "imagine-r-etudiant",
        reason: "Recommandé pour un profil étudiant ou post-bac.",
      };
    }

    if (member.profileType === "YOUNG" || member.relationship === "CHILD" || answers.lifeSituation === "CHILD_SCHOOL") {
      if (typeof age === "number" && age < 11) {
        return {
          slug: "imagine-r-junior",
          reason: "Recommandé car ce profil a moins de 11 ans.",
        };
      }

      if (schoolLevel === "COLLEGE" || schoolLevel === "LYCEE" || answers.lifeSituation === "CHILD_SCHOOL") {
        return {
          slug: "imagine-r-scolaire",
          reason: "Recommandé car ce profil est scolarisé et peut préparer un dossier Imagine R.",
        };
      }

      return {
        slug: "imagine-r-scolaire",
        reason: "Recommandé comme première offre jeune à vérifier.",
      };
    }

    if (member.profileType === "SENIOR" || answers.lifeSituation === "SENIOR") {
      if (typeof age === "number" && age >= 62) {
        return {
          slug: "navigo-senior",
          reason: "Recommandé car ce profil senior peut vérifier une offre adaptée.",
        };
      }

      return {
        slug: "amethyste",
        reason: "Une vérification complémentaire permettra de confirmer l'offre senior la plus adaptée.",
      };
    }

    return {
      slug: "navigo-annuel",
      reason: "Recommandé pour un adulte qui souhaite voyager régulièrement.",
    };
  }

  async getOffers(filters: {
    profileType?: string;
    targetProfile?: string;
    productType?: string;
  }) {
    const where = {
      isActive: true,
      ...(filters.targetProfile ? { targetProfile: filters.targetProfile as never } : {}),
      ...(filters.productType ? { productType: filters.productType as never } : {}),
    };

    const offers = await this.prismaService.productOffer.findMany({
      where,
      include: this.offerInclude,
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    if (!filters.profileType) {
      return offers.map((offer) => this.formatOffer(offer));
    }

    const profileType = filters.profileType;
    return offers
      .filter((offer) => {
        if (profileType === "YOUNG") {
          return ["CHILD", "YOUNG", "STUDENT"].includes(offer.targetProfile);
        }

        if (profileType === "SENIOR") {
          return offer.targetProfile === "SENIOR" || offer.targetProfile === "SOLIDARITY";
        }

        if (profileType === "MANAGER") {
          return offer.targetProfile === "ADULT" || offer.targetProfile === "FAMILY";
        }

        return true;
      })
      .map((offer) => this.formatOffer(offer));
  }

  async getOfferDetail(slug: string) {
    const offer = await this.findOfferBySlug(slug);

    if (!offer || !offer.isActive) {
      throw new NotFoundException("Offre introuvable.");
    }

    const relatedOffers = await this.prismaService.productOffer.findMany({
      where: {
        isActive: true,
        slug: { not: offer.slug },
        OR: [
          { targetProfile: offer.targetProfile },
          { productType: { in: ["IMAGINE_R_JUNIOR", "IMAGINE_R_SCHOOL", "IMAGINE_R_STUDENT", "NAVIGO_SENIOR"] } },
        ],
      },
      include: this.offerInclude,
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: 3,
    });

    return {
      ...this.formatOffer(offer),
      relatedOffers: relatedOffers.map((candidate) => this.formatOffer(candidate)),
    };
  }

  async recommendForUser(userId: string, payload: RecommendTitleDto) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: {
        members: true,
      },
    });

    if (!household) {
      throw new NotFoundException("Aucun foyer trouvé.");
    }

    const member = household.members.find((candidate) => candidate.id === payload.householdMemberId);

    if (!member) {
      throw new BadRequestException("Ce profil n'appartient pas à votre foyer.");
    }

    const recommendation = this.selectOfferSlug(member, payload.answers);
    const offer = await this.findOfferBySlug(recommendation.slug);

    if (!offer || !offer.isActive) {
      throw new NotFoundException("Aucune offre adaptée n'est disponible pour ce profil.");
    }

    const formattedOffer = this.formatOffer(offer);

    return {
      recommendedOffer: formattedOffer,
      reason: recommendation.reason,
      requiredDocuments: formattedOffer.requiredDocuments,
      nextAction: member.profileType === "SENIOR" ? "Préparer le dossier" : "Continuer ma souscription",
    };
  }
}
