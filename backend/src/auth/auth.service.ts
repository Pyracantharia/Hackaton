import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dtos/login.dto";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { RegisterFamilyDto } from "./dtos/register-family.dto";
import { GoogleAuthDto } from "./dtos/google-auth.dto";
import { PrismaService } from "src/prisma/prisma.service";
import argon2 from "argon2";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  family_name?: string;
  given_name?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async verifyGoogleCredential(credential: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new InternalServerErrorException("La connexion Google n'est pas configurée côté serveur.");
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);

    if (!response.ok) {
      throw new UnauthorizedException("La connexion Google a échoué. Réessayez avec votre compte Google.");
    }

    const tokenInfo = await response.json() as GoogleTokenInfo;

    if (tokenInfo.aud !== googleClientId) {
      throw new UnauthorizedException("Le token Google ne correspond pas à cette application.");
    }

    if (!tokenInfo.sub) {
      throw new UnauthorizedException("Google n'a pas retourné d'identifiant de compte.");
    }

    if (!tokenInfo.email) {
      throw new BadRequestException("Google n'a pas retourné d'adresse e-mail.");
    }

    return {
      providerId: tokenInfo.sub,
      email: this.normalizeEmail(tokenInfo.email),
      firstName: tokenInfo.given_name ?? tokenInfo.name?.split(" ")[0] ?? "",
      lastName: tokenInfo.family_name ?? tokenInfo.name?.split(" ").slice(1).join(" ") ?? "",
      avatarUrl: tokenInfo.picture ?? null,
      emailVerified: tokenInfo.email_verified === true || tokenInfo.email_verified === "true",
    };
  }

  private buildAuthResponse(user: { id: string; firstName: string; lastName: string; email: string; role: string }) {
    return this.signAccessToken(user).then((accessToken) => ({
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    }));
  }

  async login(data: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException("Adresse e-mail ou mot de passe incorrect.");
    }

    if (user.authProvider === "GOOGLE" && !user.passwordHash) {
      throw new UnauthorizedException("Ce compte utilise Google. Cliquez sur Se connecter avec Google.");
    }

    const passwordMatches = await argon2.verify(user.passwordHash, data.password);

    if (!passwordMatches) {
      throw new UnauthorizedException("Adresse e-mail ou mot de passe incorrect.");
    }

    return this.buildAuthResponse(user);
  }

  async googleProfile(data: GoogleAuthDto) {
    const profile = await this.verifyGoogleCredential(data.credential);

    return {
      provider: "GOOGLE",
      providerId: profile.providerId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
    };
  }

  async googleLogin(data: GoogleAuthDto) {
    const profile = await this.verifyGoogleCredential(data.credential);
    const user = await this.prismaService.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      throw new UnauthorizedException("Aucun compte famille n'est lié à ce compte Google. Créez d'abord votre espace famille avec Google.");
    }

    if (user.authProvider !== "GOOGLE" || user.providerId !== profile.providerId) {
      throw new BadRequestException("Cette adresse e-mail existe déjà avec une connexion classique. Connectez-vous avec votre mot de passe avant de lier Google.");
    }

    return this.buildAuthResponse(user);
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

      const parentEmail = this.normalizeEmail(data.parent.email);
      const authProvider = data.parent.authProvider ?? "LOCAL";
      const googleProfile = authProvider === "GOOGLE"
        ? await this.verifyGoogleCredential(data.parent.googleIdToken ?? "")
        : null;

      if (googleProfile && googleProfile.email !== parentEmail) {
        throw new BadRequestException("L'adresse e-mail Google ne correspond pas à l'adresse du formulaire.");
      }

      const existingUser = await this.prismaService.user.findUnique({
        where: { email: parentEmail },
      });

      if (existingUser) {
        throw new BadRequestException("Un utilisateur avec cet email existe déjà");
      }

      const passwordHash = authProvider === "GOOGLE" ? "" : await argon2.hash(data.parent.password ?? "");
      const result = await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: data.parent.firstName,
            lastName: data.parent.lastName,
            email: parentEmail,
            phone: data.parent.phone,
            passwordHash,
            authProvider,
            providerId: googleProfile?.providerId,
            avatarUrl: googleProfile?.avatarUrl,
            phoneVerified: true,
            emailVerified: authProvider === "GOOGLE" ? (googleProfile?.emailVerified ?? true) : true,
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
                        href: `/dashboard/family/titles/recommendation?memberId=${record.id}`,
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
