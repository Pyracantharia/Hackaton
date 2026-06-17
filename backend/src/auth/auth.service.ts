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

  private getAge(birthDate: string) {
    const date = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDelta = today.getMonth() - date.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
      age -= 1;
    }

    return Number.isFinite(age) ? age : null;
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

      const familyMembers = data.members?.length
        ? data.members
        : data.child
          ? [{
              type: "YOUNG" as const,
              relationship: "CHILD" as const,
              firstName: data.child.firstName,
              lastName: data.child.lastName,
              birthDate: data.child.birthDate,
              schoolLevel: data.child.schoolLevel,
              department: data.child.department,
              isHolder: true,
              isPayer: false,
            }]
          : [];

      if (!familyMembers.length) {
        throw new BadRequestException("Ajoutez au moins un profil pour créer l'espace famille.");
      }

      const hasMinorYoungMember = familyMembers.some((member) => {
        const age = this.getAge(member.birthDate);
        return member.type === "YOUNG" && age !== null && age < 18;
      });

      if (hasMinorYoungMember && !data.roles.parentIsLegalRepresentative) {
        throw new BadRequestException("Le responsable légal doit confirmer son rôle pour ajouter un mineur.");
      }

      for (const member of familyMembers) {
        if (member.type === "YOUNG" && !member.schoolLevel) {
          throw new BadRequestException(`Le niveau scolaire est obligatoire pour ${member.firstName}.`);
        }
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
            profileType: "MANAGER",
            isHolder: false,
            isPayer: data.roles.parentIsPayer,
            isLegalRepresentative: data.roles.parentIsLegalRepresentative,
          },
        });

        const createdMembers: Array<{
          input: (typeof familyMembers)[number];
          record: typeof parentMember;
        }> = [];

        for (const member of familyMembers) {
          const createdMember = await tx.householdMember.create({
            data: {
              householdId: household.id,
              firstName: member.firstName,
              lastName: member.lastName,
              birthDate: new Date(member.birthDate),
              relationship: member.type === "YOUNG" ? "CHILD" : "RELATIVE",
              profileType: member.type,
              schoolLevel: member.type === "YOUNG" ? member.schoolLevel : null,
              department: member.department,
              isHolder: member.isHolder,
              isPayer: member.isPayer,
              isLegalRepresentative: false,
            },
          });

          createdMembers.push({ input: member, record: createdMember });
        }

        await tx.familyNotification.createMany({
          data: createdMembers.map(({ input, record }) => (
            input.type === "YOUNG"
              ? {
                  householdId: household.id,
                  memberId: record.id,
                  type: "OFFER_RECOMMENDATION" as const,
                  severity: "INFO" as const,
                  title: `${input.firstName} — Forfait jeune a choisir`,
                  message:
                    "Aucun titre n'est encore rattache. Vous pourrez comparer les offres jeune adaptees a son profil.",
                }
              : {
                  householdId: household.id,
                  memberId: record.id,
                  type: "OFFER_RECOMMENDATION" as const,
                  severity: "INFO" as const,
                  title: `${input.firstName} — Offre Senior a verifier`,
                  message:
                    "Un accompagnement peut aider a identifier l'offre Navigo Senior ou Amethyste adaptee.",
                }
          )),
        });

        await tx.familyNotification.create({
          data: {
            householdId: household.id,
            memberId: null,
            type: "SERVICE_INFO",
            severity: "INFO",
            title: "Information service",
            message:
              "Les alertes importantes sont liees au suivi de vos titres et ne sont pas des communications commerciales.",
          },
        });

        await tx.householdActivity.createMany({
          data: [
            {
              householdId: household.id,
              label: "Espace famille cree.",
            },
            {
              householdId: household.id,
              label: `${createdMembers.length} profil(s) ajoute(s) au foyer.`,
            },
            {
              householdId: household.id,
              memberId: parentMember.id,
              label: `Role payeur confirme pour ${data.parent.firstName}.`,
            },
            ...createdMembers.map(({ input, record }) => ({
              householdId: household.id,
              memberId: record.id,
              label: input.type === "YOUNG"
                ? `Profil jeune ajoute pour ${input.firstName}, sans titre rattache.`
                : `Offre Senior a verifier pour ${input.firstName}.`,
            })),
          ],
        });

        await tx.memberProfileDetail.create({
          data: {
            householdMemberId: parentMember.id,
            householdRole: "Gestionnaire du foyer",
            overview: "Votre espace centralise les profils, les paiements et les prochaines actions du foyer.",
            supportNote: "Vous etes le point d'entree principal pour le suivi des dossiers et des alertes.",
            accessibilityNote: null,
            documents: ["Attestation employeur", "RIB si necessaire"],
            actions: {
              create: [
                {
                  label: "Gerer mes informations",
                  href: "/dashboard/family?tab=profiles",
                  variant: "PRIMARY",
                  order: 1,
                },
                {
                  label: "Attestation employeur",
                  href: "/dashboard/family",
                  variant: "SECONDARY",
                  order: 2,
                },
              ],
            },
          },
        });

        for (const { input, record } of createdMembers) {
          const isYoung = input.type === "YOUNG";

          await tx.memberProfileDetail.create({
            data: {
              householdMemberId: record.id,
              householdRole: isYoung ? "Porteur du titre scolaire" : "Profil senior accompagne",
              overview: isYoung
                ? `${input.firstName} n'a pas encore de titre rattache. Vous pourrez choisir une offre adaptee a son profil.`
                : `${input.firstName} pourra verifier une offre Navigo Senior ou Amethyste adaptee a sa situation.`,
              supportNote: isYoung
                ? `Payeur : ${data.parent.firstName} ${data.parent.lastName}. Documents attendus : photo recente et certificat scolaire.`
                : `Gestionnaire : ${data.parent.firstName} ${data.parent.lastName}. Les justificatifs dependront de l'offre retenue.`,
              accessibilityNote: null,
              documents: isYoung
                ? ["Photo recente", "Certificat scolaire", "Piece d'identite si demandee"]
                : ["Piece d'identite", "Justificatif de domicile", "Justificatif de situation si demande"],
              actions: {
                create: isYoung
                  ? [
                      {
                        label: "Trouver une offre adaptee",
                        href: `/dashboard/family/renewal/${record.id}`,
                        variant: "PRIMARY",
                        order: 1,
                      },
                      {
                        label: "Voir les justificatifs",
                        href: `/dashboard/family/members/${record.id}#documents`,
                        variant: "SECONDARY",
                        order: 2,
                      },
                    ]
                  : [
                      {
                        label: "Verifier l'offre adaptee",
                        href: `/dashboard/family/members/${record.id}#eligibilite`,
                        variant: "PRIMARY",
                        order: 1,
                      },
                      {
                        label: "Voir le profil",
                        href: `/dashboard/family/members/${record.id}`,
                        variant: "SECONDARY",
                        order: 2,
                      },
                    ],
              },
            },
          });
        }

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

        return { user, household, members: [parentMember, ...createdMembers.map(({ record }) => record)] };
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
          label: `Voir les recommandations du foyer`,
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
