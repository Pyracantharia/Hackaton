import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dtos/login.dto";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { RegisterFamilyDto } from "./dtos/register-family.dto";
import { PrismaService } from "src/prisma/prisma.service";
import argon2 from "argon2";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService
  ){}

  private async signAccessToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(data: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException("Adresse e-mail ou mot de passe incorrect.");
    }

    const passwordMatches = await argon2.verify(user.passwordHash, data.password);

    if (!passwordMatches) {
      throw new UnauthorizedException("Adresse e-mail ou mot de passe incorrect.");
    }

    const accessToken = await this.signAccessToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async registerUser(data: RegisterUserDto) {
   try {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: data.email
      }
    });

    if(existingUser){
      throw new BadRequestException("Un utilisateur avec cet email existe déjà");
    }

    if(data.password !== data.confirmationPassword){
      throw new BadRequestException("Les mots de passe ne correspondent pas");
    }
    
    const hashedPassword = await argon2.hash(data.password);
    const [firstName, ...lastNameParts] = data.name.trim().split(/\s+/);
    const newUser = await this.prismaService.user.create({
      data: {
       firstName: firstName ?? data.name,
       lastName: lastNameParts.join(" "),
       email: data.email,
       passwordHash: hashedPassword
      }
    });

   const {passwordHash, ...userWithoutPassword} = newUser
    return {
      message: "Compte crée avec succès",
      user: userWithoutPassword
    }
   } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(`Une erreur est survenue lors de l'enregistrement de l'utilisateur: ${error.message}`)
   }
  }

  async registerFamily(data: RegisterFamilyDto) {
    try {
      if (data.verification.smsCode !== "123456" || data.verification.emailCode !== "654321") {
        throw new BadRequestException("Les codes de vérification sont incorrects.");
      }

      if (!data.consents.serviceAlerts) {
        throw new BadRequestException("Les alertes indispensables doivent être activées pour créer l'espace famille.");
      }

      if (!data.roles.parentIsLegalRepresentative) {
        throw new BadRequestException("Le responsable légal doit confirmer son rôle pour ajouter un enfant.");
      }

      const existingUser = await this.prismaService.user.findUnique({
        where: { email: data.parent.email },
      });

      if (existingUser) {
        throw new BadRequestException("Un utilisateur avec cet email existe déjà");
      }

      const passwordHash = await argon2.hash(data.parent.password);
      const result = await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: data.parent.firstName,
            lastName: data.parent.lastName,
            email: data.parent.email,
            phone: data.parent.phone,
            passwordHash,
            phoneVerified: true,
            emailVerified: true,
          },
        });

        const household = await tx.household.create({
          data: {
            ownerId: user.id,
            name: `Famille ${data.parent.lastName}`,
          },
        });

        const parentMember = await tx.householdMember.create({
          data: {
            householdId: household.id,
            firstName: data.parent.firstName,
            lastName: data.parent.lastName,
            relationship: "SELF",
            isHolder: false,
            isPayer: data.roles.parentIsPayer,
            isLegalRepresentative: data.roles.parentIsLegalRepresentative,
          },
        });

        const childMember = await tx.householdMember.create({
          data: {
            householdId: household.id,
            firstName: data.child.firstName,
            lastName: data.child.lastName,
            birthDate: new Date(data.child.birthDate),
            relationship: "CHILD",
            schoolLevel: data.child.schoolLevel,
            department: data.child.department,
            isHolder: true,
            isPayer: false,
            isLegalRepresentative: false,
          },
        });

        await tx.consent.createMany({
          data: [
            {
              userId: user.id,
              type: "SERVICE_ALERTS",
              accepted: data.consents.serviceAlerts,
            },
            {
              userId: user.id,
              type: "MOBILITY_NEWS",
              accepted: data.consents.mobilityNews,
            },
            {
              userId: user.id,
              type: "PARTNER_OFFERS",
              accepted: data.consents.partnerOffers,
            },
          ],
        });

        return { user, household, members: [parentMember, childMember] };
      });

      const accessToken = await this.signAccessToken(result.user);

      return {
        user: {
          id: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
        },
        household: {
          id: result.household.id,
          name: result.household.name,
        },
        members: result.members.map((member) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          relationship: member.relationship,
          isHolder: member.isHolder,
          isPayer: member.isPayer,
          isLegalRepresentative: member.isLegalRepresentative,
        })),
        nextAction: {
          type: "RECOMMEND_PRODUCT",
          label: `Voir le forfait recommandé pour ${data.child.firstName}`,
        },
        accessToken,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(`Une erreur est survenue lors de la création de l'espace famille: ${error.message}`)
    }
  }
}
