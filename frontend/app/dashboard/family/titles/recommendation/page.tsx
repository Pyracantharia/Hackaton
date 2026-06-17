"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { LifeSituationCard } from "@/components/molecules/LifeSituationCard";
import { ProfilePickerCard } from "@/components/molecules/ProfilePickerCard";
import { RecommendationCard } from "@/components/molecules/RecommendationCard";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getMyHouseholdDashboard } from "@/lib/api/households";
import { recommendTitle } from "@/lib/api/titles";
import type {
  DashboardMember,
  HouseholdDashboardResponse,
  IdfDepartment,
  RecommendationAnswers,
  SchoolLevel,
  TitleRecommendationResponse,
} from "@/lib/api/types";
import { familyDashboardMock } from "@/lib/demo/familyDashboardMock";
import { titleOffersMock } from "@/lib/demo/titleOffersMock";

type LifeSituation = NonNullable<RecommendationAnswers["lifeSituation"]>;

const lifeSituations: Array<{ value: LifeSituation; label: string; description: string }> = [
  {
    value: "CHILD_SCHOOL",
    label: "Enfant scolarise",
    description: "College, lycee ou renouvellement avant la rentree.",
  },
  {
    value: "CHILD_JUNIOR",
    label: "Enfant de moins de 11 ans",
    description: "Pour preparer un titre jeune adapte aux plus petits.",
  },
  {
    value: "STUDENT",
    label: "Etudes superieures",
    description: "Pour orienter vers une offre post-bac.",
  },
  {
    value: "SENIOR",
    label: "Senior ou retraite",
    description: "Pour verifier Navigo Senior ou Ametyste.",
  },
  {
    value: "ADULT_EMPLOYEE",
    label: "Adulte actif",
    description: "Pour une offre annuelle ou a l'usage.",
  },
];

const schoolLevels: Array<{ value: SchoolLevel; label: string }> = [
  { value: "PRIMARY", label: "Ecole primaire" },
  { value: "COLLEGE", label: "College" },
  { value: "LYCEE", label: "Lycee" },
  { value: "HIGHER_EDUCATION", label: "Etudes superieures" },
  { value: "OTHER", label: "Autre" },
];

function buildSummaryItems(data: HouseholdDashboardResponse) {
  return [
    `Bonjour ${data.manager.firstName}`,
    `${data.summary.membersCount} profils suivis`,
    "Assistant titre",
  ];
}

function inferLifeSituation(member: DashboardMember): LifeSituation {
  if (member.profileType === "SENIOR") {
    return "SENIOR";
  }

  if (member.profileType === "YOUNG") {
    return "CHILD_SCHOOL";
  }

  return "ADULT_EMPLOYEE";
}

function calculateAgeFromBirthDate(birthDate: string | null) {
  if (!birthDate) {
    return undefined;
  }

  const parsedBirthDate = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDelta = today.getMonth() - parsedBirthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsedBirthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function inferSchoolLevelFromAge(age: number | undefined): SchoolLevel | undefined {
  if (typeof age !== "number") {
    return undefined;
  }

  if (age < 11) {
    return "PRIMARY";
  }

  if (age < 15) {
    return "COLLEGE";
  }

  if (age < 18) {
    return "LYCEE";
  }

  return undefined;
}

function buildAnswersFromMember(member: DashboardMember): RecommendationAnswers {
  const age = calculateAgeFromBirthDate(member.birthDate);
  const lifeSituation = inferLifeSituation(member);
  const inferredSchoolLevel = member.profileType === "YOUNG"
    ? (member.schoolLevel ?? inferSchoolLevelFromAge(age))
    : undefined;

  return {
    lifeSituation,
    age,
    schoolLevel: inferredSchoolLevel,
    department: member.department ?? undefined,
  };
}

function localRecommendation(member: DashboardMember, answers: RecommendationAnswers): TitleRecommendationResponse {
  const offer =
    answers.lifeSituation === "CHILD_JUNIOR" || (member.profileType === "YOUNG" && (answers.age ?? 12) < 11)
      ? titleOffersMock.find((candidate) => candidate.slug === "imagine-r-junior")
      : answers.lifeSituation === "STUDENT" || answers.schoolLevel === "HIGHER_EDUCATION"
        ? titleOffersMock.find((candidate) => candidate.slug === "imagine-r-etudiant")
        : answers.lifeSituation === "SENIOR" || member.profileType === "SENIOR"
          ? titleOffersMock.find((candidate) => candidate.slug === "navigo-senior")
          : member.profileType === "YOUNG"
            ? titleOffersMock.find((candidate) => candidate.slug === "imagine-r-scolaire")
            : titleOffersMock.find((candidate) => candidate.slug === "navigo-annuel");

  const recommendedOffer = offer ?? titleOffersMock[0];

  return {
    recommendedOffer,
    reason: "Cette offre correspond au profil selectionne et aux informations indiquees.",
    requiredDocuments: recommendedOffer.requiredDocuments,
    nextAction: "Continuer ma souscription",
  };
}

function RecommendationPageContent() {
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<HouseholdDashboardResponse | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(searchParams.get("memberId"));
  const [answers, setAnswers] = useState<RecommendationAnswers>({});
  const [recommendation, setRecommendation] = useState<TitleRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    async function loadDashboard() {
      try {
        const response = accessToken ? await getMyHouseholdDashboard(accessToken) : familyDashboardMock;
        setDashboard(response);
        const initialMemberId = searchParams.get("memberId") ?? response.members[0]?.id ?? null;
        setSelectedMemberId(initialMemberId);
        const initialMember = response.members.find((member) => member.id === initialMemberId) ?? response.members[0];
        if (initialMember) {
          setAnswers(buildAnswersFromMember(initialMember));
        }
      } catch (error) {
        setDashboard(familyDashboardMock);
        const initialMemberId = searchParams.get("memberId") ?? familyDashboardMock.members[0]?.id ?? null;
        const initialMember = familyDashboardMock.members.find((member) => member.id === initialMemberId) ?? familyDashboardMock.members[0];
        setSelectedMemberId(initialMemberId);
        if (initialMember) {
          setAnswers(buildAnswersFromMember(initialMember));
        }
        setMessage(error instanceof Error ? error.message : "Mode demo active.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [searchParams]);

  const data = dashboard ?? familyDashboardMock;
  const selectedMember = useMemo(
    () => data.members.find((member) => member.id === selectedMemberId) ?? data.members[0],
    [data.members, selectedMemberId],
  );

  async function handleRecommend() {
    if (!selectedMember) {
      setMessage("Selectionnez un profil pour continuer.");
      return;
    }

    const nextAnswers: RecommendationAnswers = {
      ...answers,
      lifeSituation: answers.lifeSituation ?? inferLifeSituation(selectedMember),
    };

    setIsSubmitting(true);
    setMessage(null);

    try {
      const accessToken = localStorage.getItem("familyAccessToken");
      if (!accessToken) {
        setRecommendation(localRecommendation(selectedMember, nextAnswers));
        return;
      }

      const response = await recommendTitle(accessToken, {
        householdMemberId: selectedMember.id,
        answers: nextAnswers,
      });
      setRecommendation(response);
    } catch {
      setRecommendation(localRecommendation(selectedMember, nextAnswers));
      setMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        activeTab="titles"
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/dashboard/family", label: "Mon foyer Navigo" },
          { href: "/dashboard/family/titles", label: "Titres" },
          { label: "Recommandation" },
        ]}
        subtitle="Quelques questions suffisent pour orienter le foyer."
        summaryItems={["Chargement"]}
        title="Trouver le bon titre"
        userName="Mon espace"
      >
        <InfoBox>Chargement de l'assistant...</InfoBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { href: "/dashboard/family/titles", label: "Titres" },
        { label: "Recommandation" },
      ]}
      subtitle="Choisissez un profil, precisez sa situation, puis lancez la recommandation."
      summaryItems={buildSummaryItems(data)}
      title="Trouver le bon titre"
      userName={data.manager.firstName}
    >
      <div className="grid gap-8">
        {message ? <InfoBox>{message}</InfoBox> : null}

        <section>
          <h2 className="text-2xl font-bold text-idfm-anthracite">1. Profil concerne</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.members.map((member) => (
              <ProfilePickerCard
                key={member.id}
                isSelected={member.id === selectedMember?.id}
                member={member}
                onSelect={() => {
                  setSelectedMemberId(member.id);
                  setAnswers(buildAnswersFromMember(member));
                  setRecommendation(null);
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-idfm-anthracite">2. Situation</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lifeSituations.map((situation) => (
              <LifeSituationCard
                key={situation.value}
                description={situation.description}
                isSelected={answers.lifeSituation === situation.value}
                label={situation.label}
                onSelect={() => {
                  setAnswers((current) => ({ ...current, lifeSituation: situation.value }));
                  setRecommendation(null);
                }}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-idfm-anthracite">3. Informations detectees</h2>
              <p className="mt-1 text-sm text-neutral-medium">
                Ces infos viennent du profil choisi. Vous pouvez les ajuster pour affiner la recommandation.
              </p>
            </div>
            {selectedMember ? (
              <span className="rounded-full bg-idfm-light px-4 py-2 text-sm font-bold text-idfm-interaction">
                {selectedMember.firstName} {selectedMember.lastName}
              </span>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-idfm-anthracite">
              Age
              <input
                type="number"
                min="0"
                className="min-h-12 rounded-md border border-neutral-medium px-4 text-base focus:border-idfm-focus focus:outline-none focus:ring-2 focus:ring-idfm-medium"
                value={answers.age ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, age: Number(event.target.value) || undefined }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-idfm-anthracite">
              Niveau scolaire
              <select
                className="min-h-12 rounded-md border border-neutral-medium px-4 text-base focus:border-idfm-focus focus:outline-none focus:ring-2 focus:ring-idfm-medium"
                value={answers.schoolLevel ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    schoolLevel: event.target.value ? (event.target.value as SchoolLevel) : undefined,
                  }))
                }
              >
                <option value="">Non concerne</option>
                {schoolLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-idfm-anthracite">
              Departement
              <select
                className="min-h-12 rounded-md border border-neutral-medium px-4 text-base focus:border-idfm-focus focus:outline-none focus:ring-2 focus:ring-idfm-medium"
                value={answers.department ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    department: event.target.value ? (event.target.value as IdfDepartment) : undefined,
                  }))
                }
              >
                <option value="">Non precise</option>
                {["75", "77", "78", "91", "92", "93", "94", "95"].map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard/family/titles" className="text-sm font-semibold text-idfm-interaction hover:underline">
              Retour aux titres
            </Link>
            <Button type="button" onClick={handleRecommend} disabled={isSubmitting}>
              {isSubmitting ? "Analyse en cours..." : "Voir l'offre recommandee"}
            </Button>
          </div>
        </section>

        {recommendation && selectedMember ? (
          <RecommendationCard memberId={selectedMember.id} recommendation={recommendation} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement de la recommandation...</InfoBox>}>
      <RecommendationPageContent />
    </Suspense>
  );
}
