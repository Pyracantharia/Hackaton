import type {
  DashboardMember,
  HouseholdDashboardResponse,
  MemberDetailResponse,
} from "../api/types";

const manager: DashboardMember = {
  id: "demo-manager",
  firstName: "Sophie",
  lastName: "Martin",
  birthDate: null,
  schoolLevel: null,
  department: "75",
  relationship: "SELF",
  relationLabel: "Gestionnaire du foyer",
  profileType: "MANAGER",
  currentProduct: null,
  recommendedProduct: null,
  status: "NO_SUBSCRIPTION",
  nextAction: "Aucun titre rattaché pour le moment",
  payerName: "Sophie Martin",
  isHolder: true,
  isPayer: true,
  isLegalRepresentative: true,
  isDemoProfile: false,
};

const youngMember: DashboardMember = {
  id: "demo-lucas",
  firstName: "Lucas",
  lastName: "Martin",
  birthDate: "2014-09-12",
  schoolLevel: "COLLEGE",
  department: "94",
  relationship: "CHILD",
  relationLabel: "Enfant / jeune",
  profileType: "YOUNG",
  currentProduct: null,
  recommendedProduct: null,
  status: "NO_SUBSCRIPTION",
  nextAction: "Trouver le forfait adapté",
  payerName: "Sophie Martin",
  isHolder: true,
  isPayer: false,
  isLegalRepresentative: false,
  isDemoProfile: false,
};

export const familyDashboardMock: HouseholdDashboardResponse = {
  household: {
    id: "demo-household",
    name: "Famille Martin",
  },
  manager: {
    id: "demo-manager",
    firstName: "Sophie",
    lastName: "Martin",
  },
  summary: {
    membersCount: 2,
    urgentActionsCount: 0,
    renewalsCount: 0,
    offersToCheckCount: 1,
  },
  members: [manager, youngMember],
  notifications: [
    {
      id: "notif-renewal",
      type: "OFFER_RECOMMENDATION",
      severity: "INFO",
      title: "Lucas — Forfait jeune à choisir",
      message:
        "Aucun titre n'est encore rattaché. Vous pourrez comparer les offres jeune adaptées à son profil.",
      memberId: youngMember.id,
      createdAt: "2026-06-16T09:00:00.000Z",
    },
    {
      id: "notif-service",
      type: "SERVICE_INFO",
      severity: "INFO",
      title: "Information service",
      message:
        "Les alertes importantes sont liées au suivi de vos titres et ne sont pas des communications commerciales.",
      memberId: null,
      createdAt: "2026-06-16T07:00:00.000Z",
    },
  ],
  recentActivity: [
    {
      id: "activity-space",
      label: "Espace famille créé.",
      createdAt: "2026-06-16T09:00:00.000Z",
    },
    {
      id: "activity-lucas",
      label: "Lucas a été ajouté comme profil enfant.",
      createdAt: "2026-06-16T09:05:00.000Z",
    },
    {
      id: "activity-payer",
      label: "Role payeur confirme pour Sophie.",
      createdAt: "2026-06-16T09:06:00.000Z",
    },
    {
      id: "activity-young",
      label: "Profil jeune ajoute pour Lucas, sans titre rattache.",
      createdAt: "2026-06-16T09:10:00.000Z",
    },
  ],
};

export function getDemoMemberDetail(memberId: string): MemberDetailResponse {
  const member = familyDashboardMock.members.find((candidate) => candidate.id === memberId) ?? youngMember;

  if (member.profileType === "MANAGER") {
    return {
      household: familyDashboardMock.household,
      manager: familyDashboardMock.manager,
      member,
      householdRole: "Gestionnaire du foyer",
      overview: "Votre espace centralise les profils, les paiements et les prochaines actions du foyer.",
      supportNote: "Vous êtes le point d'entrée principal pour le suivi des dossiers et des alertes.",
      accessibilityNote: null,
      documents: ["Attestation employeur", "RIB si nécessaire"],
      actions: [
        {
          label: "Gerer mes informations",
          href: "/dashboard/family?tab=profiles",
          variant: "primary",
        },
        {
          label: "Attestation employeur",
          href: "/dashboard/family",
          variant: "secondary",
        },
      ],
      alerts: familyDashboardMock.notifications.filter((notification) => notification.memberId === null),
    };
  }

  return {
    household: familyDashboardMock.household,
    manager: familyDashboardMock.manager,
    member,
    householdRole: "Profil jeune accompagne",
    overview: "Lucas n'a pas encore de titre rattache. Vous pourrez choisir une offre adaptee a son profil.",
    supportNote: "Payeur : Sophie Martin. Documents attendus : photo récente et certificat scolaire.",
    accessibilityNote: null,
    documents: ["Photo récente", "Certificat scolaire", "Pièce d'identité si demandée"],
    actions: [
      {
        label: "Trouver une offre adaptee",
        href: `/dashboard/family/titles/recommendation?memberId=${member.id}`,
        variant: "primary",
      },
      {
        label: "Voir les justificatifs",
        href: `/dashboard/family/members/${member.id}#documents`,
        variant: "secondary",
      },
    ],
    alerts: familyDashboardMock.notifications.filter((notification) => notification.memberId === member.id),
  };
}
