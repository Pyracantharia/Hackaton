import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class HouseholdsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHouseholdForUser(userId: string) {
    const household = await this.prismaService.household.findFirst({
      where: { ownerId: userId },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!household) {
      throw new NotFoundException("Aucun espace famille trouvé pour cet utilisateur.");
    }

    return household;
  }

  async getHouseholdMembersForUser(userId: string) {
    const household = await this.getHouseholdForUser(userId);
    return household.members;
  }
}
