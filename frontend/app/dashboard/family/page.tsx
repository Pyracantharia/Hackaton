"use client";

import { Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InfoBox } from "@/components/molecules/InfoBox";
import { AddMemberPanel } from "@/components/organisms/AddMemberPanel";
import { FamilyAlertsSection } from "@/components/organisms/FamilyAlertsSection";
import { FamilyHelpSection } from "@/components/organisms/FamilyHelpSection";
import { FamilyMembersSection } from "@/components/organisms/FamilyMembersSection";
import { FamilyQuickActions } from "@/components/organisms/FamilyQuickActions";
import { FamilyRecentActivity } from "@/components/organisms/FamilyRecentActivity";
import { LostPassModal } from "@/components/organisms/LostPassModal";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import {
  createLostPassSupportCase,
  getMyHouseholdDashboard,
} from "@/lib/api/households";
import type { HouseholdDashboardResponse } from "@/lib/api/types";

type FlashMessage = {
  message: string;
  tone: "blue" | "green" | "orange" | "red";
};

type DashboardTabId = "overview" | "profiles" | "titles" | "services" | "alerts" | "help";

function getActiveTab(value: string | null): DashboardTabId {
  switch (value) {
    case "profiles":
    case "titles":
    case "services":
    case "alerts":
    case "help":
      return value;
    default:
      return "overview";
  }
}

function getStoredUserName() {
  if (typeof window === "undefined") {
    return "Mon espace";
  }

  const storedUser = sessionStorage.getItem("familyUser");

  if (!storedUser) {
    return "Mon espace";
  }

  try {
    const user = JSON.parse(storedUser) as { firstName?: string };
    return user.firstName ?? "Mon espace";
  } catch {
    return "Mon espace";
  }
}

function buildSummaryItems(data: HouseholdDashboardResponse) {
  return [
    `Bonjour ${data.manager.firstName}`,
    `${data.summary.membersCount} profils suivis`,
    `${data.summary.renewalsCount} renouvellement conseille`,
    `${data.summary.offersToCheckCount} offre a verifier`,
    `${data.summary.urgentActionsCount} action urgente`,
  ];
}

function FamilyDashboardFallback() {
  return (
    <DashboardLayout
      activeTab="overview"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { label: "Mon foyer Navigo" },
      ]}
      subtitle="Gerez les titres de votre foyer depuis un seul espace, avec des alertes, des profils et des actions adaptees a chaque situation."
      summaryItems={["Chargement du foyer"]}
      title="Mon foyer Navigo"
      userName="Mon espace"
    >
      <InfoBox>Chargement du foyer et des prochaines actions...</InfoBox>
    </DashboardLayout>
  );
}

function FamilyDashboardPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<HouseholdDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(() => (
    typeof window !== "undefined" ? Boolean(localStorage.getItem("familyAccessToken")) : true
  ));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [isLostPassOpen, setIsLostPassOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [isSubmittingLostPass, setIsSubmittingLostPass] = useState(false);
  const activeTab = getActiveTab(searchParams.get("tab"));

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setIsLoading(false);
      setLoadError("Connectez-vous pour charger votre foyer.");
      return;
    }

    void getMyHouseholdDashboard(accessToken)
      .then((response) => {
        startTransition(() => {
          setData(response);
        });
      })
      .catch((error: Error) => {
        startTransition(() => {
          setLoadError(error.message);
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleLostPassSubmit(payload: { memberId: string; reason: string }) {
    const accessToken = localStorage.getItem("familyAccessToken");
    if (!data) {
      return;
    }

    if (!accessToken) {
      setFlash({ message: "Impossible d'enregistrer la demande sans session active.", tone: "red" });
      return;
    }

    setIsSubmittingLostPass(true);

    let message = "Demande de remplacement creee.";

    try {
      const response = await createLostPassSupportCase(accessToken, payload);
      message = response.message;
    } catch {
      setFlash({ message: "La demande n'a pas pu etre enregistree pour le moment.", tone: "red" });
      setIsSubmittingLostPass(false);
      return;
    }

    const targetMember = data.members.find((member) => member.id === payload.memberId);

    startTransition(() => {
      setData((current) => (
        current
          ? {
              ...current,
              members: current.members.map((member) => (
                member.id === payload.memberId
                  ? {
                      ...member,
                      status: "LOST",
                      nextAction: "Suivre la demande de remplacement",
                    }
                  : member
              )),
              recentActivity: [
                {
                  id: `activity-lost-pass-${Date.now()}`,
                  label: `${targetMember?.firstName ?? "Le profil"} a signale une perte de passe.`,
                  createdAt: new Date().toISOString(),
                },
                ...current.recentActivity,
              ].slice(0, 6),
            }
          : current
      ));
      setFlash({ message, tone: "green" });
      setIsLostPassOpen(false);
    });

    setIsSubmittingLostPass(false);
  }

  function handleSelectProfile(profileType: string) {
    if (profileType === "young") {
      setFlash({
        message: "Le parcours enfant / jeune est deja couvert par Lucas dans cette demo.",
        tone: "blue",
      });
      return;
    }

    if (profileType === "senior") {
      setFlash({
        message: "Le parcours retraite / senior sera branche sur un vrai profil des qu'il sera ajoute au foyer.",
        tone: "blue",
      });
      return;
    }

    setFlash({
      message: "Cette cible sera disponible prochainement dans le compte famille.",
      tone: "orange",
    });
  }

  function renderActiveSection() {
    if (!data) {
      return <InfoBox tone={loadError ? "orange" : "blue"}>{loadError ?? "Chargement du foyer..."}</InfoBox>;
    }

    switch (activeTab) {
      case "profiles":
        return (
          <div className="grid gap-12">
            <FamilyMembersSection members={data.members} />
            <AddMemberPanel onSelectProfile={handleSelectProfile} />
          </div>
        );
      case "titles":
        return (
          <FamilyMembersSection
            cardsId="titles-grid"
            description="Retrouvez l'etat des abonnements, les renouvellements conseilles et les prochaines actions pour chaque profil."
            members={data.members}
            sectionId="titles"
            title="Titres du foyer"
          />
        );
      case "services":
        return (
          <FamilyQuickActions
            members={data.members}
            onLostPassRequested={(memberId) => {
              setSelectedMemberId(memberId);
              setIsLostPassOpen(true);
            }}
          />
        );
      case "alerts":
        return <FamilyAlertsSection notifications={data.notifications} />;
      case "help":
        return <FamilyHelpSection />;
      case "overview":
      default:
        return (
          <div className="grid gap-12">
            <FamilyAlertsSection notifications={data.notifications} />
            <FamilyMembersSection members={data.members} />
            <AddMemberPanel onSelectProfile={handleSelectProfile} />
            <FamilyQuickActions
              members={data.members}
              onLostPassRequested={(memberId) => {
                setSelectedMemberId(memberId);
                setIsLostPassOpen(true);
              }}
            />
            <FamilyHelpSection />
            <FamilyRecentActivity items={data.recentActivity} />
          </div>
        );
    }
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { label: "Mon foyer Navigo" },
      ]}
      subtitle="Gerez les titres de votre foyer depuis un seul espace, avec des alertes, des profils et des actions adaptees a chaque situation."
      summaryItems={data ? buildSummaryItems(data) : ["Chargement du foyer"]}
      title="Mon foyer Navigo"
      userName={data?.manager.firstName ?? getStoredUserName()}
    >
      <div className="grid gap-8">
        {isLoading ? (
          <InfoBox>Chargement du foyer et des prochaines actions...</InfoBox>
        ) : null}

        {flash ? <InfoBox tone={flash.tone}>{flash.message}</InfoBox> : null}

        {renderActiveSection()}
      </div>

      {isLostPassOpen ? (
        <LostPassModal
          defaultMemberId={selectedMemberId}
          isOpen={isLostPassOpen}
          isSubmitting={isSubmittingLostPass}
          members={data?.members ?? []}
          onClose={() => setIsLostPassOpen(false)}
          onSubmit={handleLostPassSubmit}
        />
      ) : null}
    </DashboardLayout>
  );
}

export default function FamilyDashboardPage() {
  return (
    <Suspense fallback={<FamilyDashboardFallback />}>
      <FamilyDashboardPageContent />
    </Suspense>
  );
}
