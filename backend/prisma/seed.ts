import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const demoUserPassword = "Password123!";
const adminPassword = "Admin123!";

const adminAccounts = [
  {
    email: "admin.demo@example.com",
    firstName: "Admin",
    lastName: "Demo",
    phone: "0600000001",
  },
  {
    email: "operations.admin@example.com",
    firstName: "Operations",
    lastName: "Admin",
    phone: "0600000002",
  },
];

async function main() {
  const email = "sophie.martin@example.com";
  const passwordHash = await argon2.hash(demoUserPassword);
  const adminPasswordHash = await argon2.hash(adminPassword);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { households: true },
  });

  if (existingUser) {
    await prisma.consent.deleteMany({ where: { userId: existingUser.id } });
    await prisma.household.deleteMany({ where: { ownerId: existingUser.id } });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName: "Sophie",
      lastName: "Martin",
      phone: "0601020304",
      passwordHash,
      phoneVerified: true,
      emailVerified: true,
    },
    create: {
      firstName: "Sophie",
      lastName: "Martin",
      email,
      phone: "0601020304",
      passwordHash,
      phoneVerified: true,
      emailVerified: true,
    },
  });

  const household = await prisma.household.create({
    data: {
      ownerId: user.id,
      name: "Famille Martin",
    },
  });

  const manager = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      firstName: "Sophie",
      lastName: "Martin",
      relationship: "SELF",
      profileType: "MANAGER",
      isHolder: true,
      isPayer: true,
      isLegalRepresentative: true,
    },
  });

  const child = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      firstName: "Lucas",
      lastName: "Martin",
      birthDate: new Date("2012-09-12T00:00:00.000Z"),
      relationship: "CHILD",
      profileType: "YOUNG",
      schoolLevel: "COLLEGE",
      department: "75",
      isHolder: true,
      isPayer: false,
      isLegalRepresentative: false,
    },
  });

  await prisma.subscription.createMany({
    data: [
      {
        householdMemberId: manager.id,
        productType: "NAVIGO_ANNUAL",
        productName: "Navigo Annuel",
        status: "ACTIVE",
        nextActionLabel: "Voir mon titre",
      },
      {
        householdMemberId: child.id,
        productType: "IMAGINE_R",
        productName: "Imagine R Scolaire",
        status: "TO_RENEW",
        nextActionLabel: "Renouveler avant la rentree",
        renewalDate: new Date("2026-08-31T00:00:00.000Z"),
      },
    ],
  });

  await prisma.familyNotification.createMany({
    data: [
      {
        householdId: household.id,
        memberId: child.id,
        type: "RENEWAL",
        severity: "WARNING",
        title: "Lucas - Renouvellement Imagine R conseille",
        message:
          "Les demandes sont nombreuses avant la rentree. Renouvelez des maintenant pour eviter les delais.",
        createdAt: new Date("2026-06-16T09:00:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: null,
        type: "SERVICE_INFO",
        severity: "INFO",
        title: "Information service",
        message:
          "Les alertes importantes sont liees au suivi de vos titres et ne sont pas des communications commerciales.",
        createdAt: new Date("2026-06-16T07:00:00.000Z"),
      },
    ],
  });

  await prisma.householdActivity.createMany({
    data: [
      {
        householdId: household.id,
        label: "Espace famille cree.",
        createdAt: new Date("2026-06-16T09:00:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: child.id,
        label: "Lucas a ete ajoute comme profil enfant.",
        createdAt: new Date("2026-06-16T09:05:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: manager.id,
        label: "Role payeur confirme pour Sophie.",
        createdAt: new Date("2026-06-16T09:06:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: child.id,
        label: "Renouvellement Imagine R recommande pour Lucas.",
        createdAt: new Date("2026-06-16T09:10:00.000Z"),
      },
    ],
  });

  await prisma.memberProfileDetail.create({
    data: {
      householdMemberId: manager.id,
      householdRole: "Gestionnaire du foyer",
      overview: "Votre espace centralise les profils, les paiements et les prochaines actions du foyer.",
      supportNote: "Vous etes le point d'entree principal pour le suivi des dossiers et des alertes.",
      accessibilityNote: null,
      documents: ["Attestation employeur", "RIB si necessaire"],
      actions: {
        create: [
          {
            label: "Voir mon titre",
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

  await prisma.memberProfileDetail.create({
    data: {
      householdMemberId: child.id,
      householdRole: "Porteur du titre",
      overview: "Lucas peut etre renouvele des maintenant pour anticiper la rentree scolaire.",
      supportNote: "Payeur : Sophie Martin. Documents attendus : photo recente et certificat scolaire.",
      accessibilityNote: null,
      documents: ["Photo recente", "Certificat scolaire", "Piece d'identite si demandee"],
      actions: {
        create: [
          {
            label: "Commencer le renouvellement",
            href: `/dashboard/family/renewal/${child.id}`,
            variant: "PRIMARY",
            order: 1,
          },
          {
            label: "Voir les justificatifs",
            href: `/dashboard/family/members/${child.id}#documents`,
            variant: "SECONDARY",
            order: 2,
          },
        ],
      },
    },
  });

  await prisma.consent.createMany({
    data: [
      { userId: user.id, type: "SERVICE_ALERTS", accepted: true },
      { userId: user.id, type: "MOBILITY_NEWS", accepted: false },
      { userId: user.id, type: "PARTNER_OFFERS", accepted: false },
    ],
  });

  for (const admin of adminAccounts) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
      create: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
    });
  }

  console.log(`Seeded demo household for ${email}`);
  console.log(`Seeded ${adminAccounts.length} admin accounts with password ${adminPassword}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
