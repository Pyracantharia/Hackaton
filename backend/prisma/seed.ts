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
const offers = [
  {
    slug: "navigo-annuel",
    name: "Forfait Navigo Annuel",
    productType: "NAVIGO_ANNUAL",
    shortDescription: "Voyager en illimité toute l'année.",
    longDescription: "Une offre annuelle pour les trajets quotidiens en Île-de-France, avec paiement mensuel possible.",
    priceLabel: "90,80 € / mois",
    durationLabel: "Annuel",
    targetProfile: "ADULT",
    order: 1,
    benefits: [
      "Idéal pour les trajets quotidiens",
      "Transports illimités selon zones",
      "Remboursement employeur possible",
    ],
    documents: [
      { documentType: "ID_DOCUMENT", label: "Pièce d'identité" },
      { documentType: "PAYMENT_METHOD", label: "Moyen de paiement" },
    ],
  },
  {
    slug: "imagine-r-junior",
    name: "Imagine R Junior",
    productType: "IMAGINE_R_JUNIOR",
    shortDescription: "Le forfait annuel des enfants de moins de 11 ans.",
    longDescription: "Un titre très avantageux pour les plus jeunes, pensé pour les déplacements du quotidien.",
    priceLabel: "25,20 € / an",
    durationLabel: "Annuel",
    targetProfile: "CHILD",
    maxAge: 10,
    order: 2,
    benefits: ["Adapté aux moins de 11 ans", "Tarif très avantageux", "Déplacements en Île-de-France"],
    documents: [
      { documentType: "PHOTO", label: "Photo récente" },
      { documentType: "ID_DOCUMENT", label: "Justificatif d'identité" },
    ],
  },
  {
    slug: "imagine-r-scolaire",
    name: "Imagine R Scolaire",
    productType: "IMAGINE_R_SCHOOL",
    shortDescription: "Le forfait annuel des jeunes scolarisés.",
    longDescription: "Une offre adaptée aux collégiens, lycéens et apprentis, avec un dossier préparé à l'avance.",
    priceLabel: "401,30 € / an",
    durationLabel: "Annuel",
    targetProfile: "YOUNG",
    minAge: 11,
    order: 3,
    benefits: ["Adapté aux collégiens et lycéens", "Transports illimités", "Renouvellement anticipable avant la rentrée"],
    documents: [
      { documentType: "PHOTO", label: "Photo récente" },
      { documentType: "ID_DOCUMENT", label: "Justificatif d'identité" },
      { documentType: "SCHOOL_CERTIFICATE", label: "Certificat scolaire" },
    ],
  },
  {
    slug: "imagine-r-etudiant",
    name: "Imagine R Étudiant",
    productType: "IMAGINE_R_STUDENT",
    shortDescription: "Le forfait annuel des étudiants.",
    longDescription: "Un parcours étudiant pour comprendre les justificatifs et préparer le dossier sans se perdre.",
    priceLabel: "401,30 € / an",
    durationLabel: "Annuel",
    targetProfile: "STUDENT",
    order: 4,
    benefits: ["Adapté aux étudiants", "Suivi du dossier", "Bourse préparée plus tard si concerné"],
    documents: [
      { documentType: "PHOTO", label: "Photo récente" },
      { documentType: "SCHOOL_CERTIFICATE", label: "Certificat de scolarité" },
      { documentType: "SCHOLARSHIP_CERTIFICATE", label: "Justificatif de bourse si concerné", required: false },
    ],
  },
  {
    slug: "navigo-senior",
    name: "Navigo Senior",
    productType: "NAVIGO_SENIOR",
    shortDescription: "Une offre à vérifier pour les seniors.",
    longDescription: "Un accompagnement simple pour préparer une offre adaptée à la situation d'un senior.",
    priceLabel: "Tarif réduit à vérifier",
    durationLabel: "Annuel ou mensuel",
    targetProfile: "SENIOR",
    minAge: 62,
    order: 5,
    benefits: ["Adapté aux seniors", "Accompagnement simplifié", "Possibilité d'aide par un proche"],
    documents: [{ documentType: "ID_DOCUMENT", label: "Pièce d'identité" }],
  },
  {
    slug: "amethyste",
    name: "Améthyste",
    productType: "AMETHYSTE",
    shortDescription: "Une offre solidaire selon département et situation.",
    longDescription: "Une orientation accompagnée pour vérifier les droits Améthyste sans moteur administratif complet.",
    priceLabel: "Selon département",
    durationLabel: "Selon droits",
    targetProfile: "SENIOR",
    order: 6,
    benefits: ["Adapté selon département", "Utile pour certains seniors", "Vérification accompagnée"],
    documents: [
      { documentType: "ID_DOCUMENT", label: "Pièce d'identité" },
      { documentType: "SITUATION_PROOF", label: "Justificatif de situation" },
    ],
  },
  {
    slug: "navigo-liberte-plus",
    name: "Navigo Liberté+",
    productType: "NAVIGO_LIBERTE",
    shortDescription: "Le paiement à l'usage pour les trajets occasionnels.",
    longDescription: "Une offre complémentaire pour voyager ponctuellement sans abonnement mensuel.",
    priceLabel: "Dès 1,64 € / trajet",
    durationLabel: "À l'usage",
    targetProfile: "ADULT",
    order: 7,
    benefits: ["Adapté aux trajets occasionnels", "Paiement à l'usage", "Complément d'offre"],
    documents: [{ documentType: "PAYMENT_METHOD", label: "Moyen de paiement" }],
  },
] as const;

async function main() {
  for (const offer of offers) {
    await prisma.productOffer.upsert({
      where: { slug: offer.slug },
      update: {
        name: offer.name,
        productType: offer.productType,
        shortDescription: offer.shortDescription,
        longDescription: offer.longDescription,
        priceLabel: offer.priceLabel,
        durationLabel: offer.durationLabel,
        targetProfile: offer.targetProfile,
        minAge: "minAge" in offer ? offer.minAge : null,
        maxAge: "maxAge" in offer ? offer.maxAge : null,
        isActive: true,
        order: offer.order,
        benefits: {
          deleteMany: {},
          create: offer.benefits.map((label, index) => ({ label, order: index + 1 })),
        },
        requiredDocuments: {
          deleteMany: {},
          create: offer.documents.map((document, index) => ({
            documentType: document.documentType,
            label: document.label,
            required: "required" in document ? document.required : true,
            order: index + 1,
          })),
        },
      },
      create: {
        slug: offer.slug,
        name: offer.name,
        productType: offer.productType,
        shortDescription: offer.shortDescription,
        longDescription: offer.longDescription,
        priceLabel: offer.priceLabel,
        durationLabel: offer.durationLabel,
        targetProfile: offer.targetProfile,
        minAge: "minAge" in offer ? offer.minAge : null,
        maxAge: "maxAge" in offer ? offer.maxAge : null,
        isActive: true,
        order: offer.order,
        benefits: {
          create: offer.benefits.map((label, index) => ({ label, order: index + 1 })),
        },
        requiredDocuments: {
          create: offer.documents.map((document, index) => ({
            documentType: document.documentType,
            label: document.label,
            required: "required" in document ? document.required : true,
            order: index + 1,
          })),
        },
      },
    });
  }

  const email = "sophie.martin@example.com";
  const passwordHash = await argon2.hash(demoUserPassword);
  const adminPasswordHash = await argon2.hash(adminPassword);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { households: true },
  });

  await prisma.supportCase.deleteMany({
    where: {
      householdId: null,
      type: "FOUND_PASS",
      passNumberMasked: "********1234",
    },
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

  const senior = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      firstName: "Marie",
      lastName: "Dupont",
      birthDate: new Date("1958-04-18T00:00:00.000Z"),
      relationship: "RELATIVE",
      profileType: "SENIOR",
      department: "75",
      isHolder: true,
      isPayer: false,
      isLegalRepresentative: false,
    },
  });

  await prisma.familyNotification.createMany({
    data: [
      {
        householdId: household.id,
        memberId: child.id,
        type: "OFFER_RECOMMENDATION",
        severity: "INFO",
        title: "Lucas - Offre jeune à choisir",
        message:
          "Aucun titre n'est encore rattaché. Vous pouvez comparer les offres jeune adaptées à son profil.",
        createdAt: new Date("2026-06-16T09:00:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: senior.id,
        type: "OFFER_RECOMMENDATION",
        severity: "INFO",
        title: "Marie - Offre senior à vérifier",
        message:
          "Un accompagnement peut aider à identifier une offre Navigo Senior ou Améthyste adaptée.",
        createdAt: new Date("2026-06-16T09:15:00.000Z"),
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
        label: "Offre jeune à choisir pour Lucas.",
        createdAt: new Date("2026-06-16T09:10:00.000Z"),
      },
      {
        householdId: household.id,
        memberId: senior.id,
        label: "Offre senior à vérifier pour Marie.",
        createdAt: new Date("2026-06-16T09:15:00.000Z"),
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
      documents: ["Pièce d'identité", "Moyen de paiement si souscription"],
      actions: {
        create: [
          {
            label: "Trouver une offre",
            href: `/dashboard/family/titles/recommendation?memberId=${manager.id}`,
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
      overview: "Lucas n'a pas encore de titre rattaché. Vous pouvez choisir l'offre adaptée avant souscription.",
      supportNote: "Payeur : Sophie Martin. Documents probables : photo récente et certificat scolaire.",
      accessibilityNote: null,
      documents: ["Photo recente", "Certificat scolaire", "Piece d'identite si demandee"],
      actions: {
        create: [
          {
            label: "Trouver une offre",
            href: `/dashboard/family/titles/recommendation?memberId=${child.id}`,
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

  await prisma.memberProfileDetail.create({
    data: {
      householdMemberId: senior.id,
      householdRole: "Profil senior accompagné",
      overview: "Marie n'a pas encore de titre rattaché. Une vérification peut orienter vers Navigo Senior ou Améthyste.",
      supportNote: "Gestionnaire : Sophie Martin. Les justificatifs dépendront de l'offre retenue.",
      accessibilityNote: "Le parcours senior reste accompagné et peut être repris plus tard.",
      documents: ["Pièce d'identité", "Justificatif de domicile", "Justificatif de situation si demandé"],
      actions: {
        create: [
          {
            label: "Vérifier l'offre adaptée",
            href: `/dashboard/family/titles/recommendation?memberId=${senior.id}`,
            variant: "PRIMARY",
            order: 1,
          },
          {
            label: "Voir le profil",
            href: `/dashboard/family/members/${senior.id}`,
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

  await prisma.supportCase.create({
    data: {
      householdId: household.id,
      memberId: child.id,
      type: "LOST_PASS",
      status: "OPEN",
      reason: "LOST",
      chosenResolution: "DEACTIVATE_ONLY",
      passNumberMasked: "**** 1234",
      description: "Passe perdu déclaré depuis l'espace famille.",
      createdAt: new Date("2026-06-16T11:00:00.000Z"),
    },
  });

  await prisma.supportCase.create({
    data: {
      type: "FOUND_PASS",
      status: "OPEN",
      passNumberMasked: "********1234",
      foundLocation: "Gare de Lyon - guichet services",
      depositedAtDesk: true,
      createdAt: new Date("2026-06-16T11:30:00.000Z"),
    },
  });

  await prisma.householdActivity.create({
    data: {
      householdId: household.id,
      memberId: child.id,
      label: "Passe perdu déclaré pour Lucas.",
      createdAt: new Date("2026-06-16T11:00:00.000Z"),
    },
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
