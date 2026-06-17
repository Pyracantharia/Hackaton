"use client";

import { Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InfoBox } from "@/components/molecules/InfoBox";
import { AddHouseholdMemberModal } from "@/components/organisms/AddHouseholdMemberModal";
import { AddMemberPanel } from "@/components/organisms/AddMemberPanel";
import { FamilyAlertsSection } from "@/components/organisms/FamilyAlertsSection";
import { FamilyHelpSection } from "@/components/organisms/FamilyHelpSection";
import { FamilyMembersSection } from "@/components/organisms/FamilyMembersSection";
import { FamilyQuickActions } from "@/components/organisms/FamilyQuickActions";
import { FamilyRecentActivity } from "@/components/organisms/FamilyRecentActivity";
import { FamilyWelcomeSection } from "@/components/organisms/FamilyWelcomeSection";
// import { LostPassModal } from "@/components/organisms/LostPassModal";
import { LostPassFlow } from "@/components/organisms/LostPassFlow";
import { SosNavigoSection } from "@/components/organisms/SosNavigoSection";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import {
  addHouseholdMember,
  createLostPassSupportCase,
  getMyHouseholdDashboard,
} from "@/lib/api/households";
import type {
  AddHouseholdMemberPayload,
  HouseholdDashboardResponse,
  LostPassPayload,
  LostPassResponse,
  RegisterMemberType,
} from "@/lib/api/types";

type FlashMessage = {
  message: string;
  tone: "blue" | "green" | "orange" | "red";
};

type DashboardTabId = "welcome" | "overview" | "profiles" | "titles" | "services" | "alerts" | "help";

function getActiveTab(value: string | null): DashboardTabId {
  switch (value) {
    case "overview":
    case "profiles":
    case "titles":
    case "services":
    case "alerts":
    case "help":
      return value;
    default:
      return "welcome";
  }
}

function buildSummaryItems(data: HouseholdDashboardResponse) {
  return [
    `${data.summary.membersCount} profils suivis`,
    `${data.summary.offersToCheckCount} offre a etudier`,
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [isLostPassOpen, setIsLostPassOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberType, setAddMemberType] = useState<RegisterMemberType>("YOUNG");
  const [isSubmittingAddMember, setIsSubmittingAddMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [isSubmittingLostPass, setIsSubmittingLostPass] = useState(false);
  const [sosRefreshSignal, setSosRefreshSignal] = useState(0);
  const activeTab = getActiveTab(searchParams.get("tab"));

  function openLostPassFlow(memberId?: string) {
    setSelectedMemberId(memberId);
    setIsLostPassOpen(true);
  }

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFlash(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [flash]);

  useEffect(() => {
    if (isLoading || activeTab !== "services" || window.location.hash !== "#sos-navigo") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document.getElementById("sos-navigo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading, activeTab]);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      queueMicrotask(() => {
        setIsLoading(false);
        setLoadError("Connectez-vous pour charger votre foyer.");
      });
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

  async function handleLostPassSubmit(payload: LostPassPayload): Promise<LostPassResponse> {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      throw new Error("Impossible d'enregistrer la demande sans session active.");
    }

    setIsSubmittingLostPass(true);

    try {
      const response = await createLostPassSupportCase(accessToken, payload);
      const targetMember = data?.members.find((member) => member.id === payload.memberId);
      const isTransfer = payload.chosenResolution === "TRANSFER_TO_PHONE";
      const activityLabel = isTransfer
        ? `${targetMember?.firstName ?? "Le profil"} a transfere son titre sur smartphone.`
        : `${targetMember?.firstName ?? "Le profil"} a signale une perte de passe.`;

      startTransition(() => {
        setData((current) => (
          current
            ? {
                ...current,
                members: current.members.map((member) => (
                  member.id === payload.memberId
                    ? {
                        ...member,
                        // Transfert : le titre reste actif (sur smartphone).
                        // Desactivation : le pass est marque comme perdu.
                        status: isTransfer ? member.status : "LOST",
                        nextAction: isTransfer
                          ? "Titre disponible sur smartphone"
                          : "Suivre la demande de remplacement",
                      }
                    : member
                )),
                recentActivity: [
                  {
                    id: `activity-lost-pass-${Date.now()}`,
                    label: activityLabel,
                    createdAt: new Date().toISOString(),
                  },
                  ...current.recentActivity,
                ].slice(0, 6),
              }
            : current
        ));
        setSosRefreshSignal((current) => current + 1);
        setFlash({ message: response.message, tone: "green" });
      });

      return response;
    } finally {
      setIsSubmittingLostPass(false);
    }
  }

  function handleSelectProfile(profileType: string) {
    if (profileType === "young") {
      setAddMemberType("YOUNG");
      setIsAddMemberOpen(true);
      return;
    }

    if (profileType === "senior") {
      setAddMemberType("SENIOR");
      setIsAddMemberOpen(true);
      return;
    }

    setFlash({
      message: "Cette cible sera disponible prochainement dans le compte famille.",
      tone: "orange",
    });
  }

  function openAddMember(profileType: RegisterMemberType = "YOUNG") {
    setAddMemberType(profileType);
    setIsAddMemberOpen(true);
  }

  function openLostPass(memberId?: string) {
    setSelectedMemberId(memberId);
    setIsLostPassOpen(true);
  }

  async function handleAddMemberSubmit(payload: AddHouseholdMemberPayload) {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setFlash({ message: "Reconnectez-vous pour ajouter un profil au foyer.", tone: "red" });
      return;
    }

    setIsSubmittingAddMember(true);

    try {
      const updatedDashboard = await addHouseholdMember(accessToken, payload);

      startTransition(() => {
        setData(updatedDashboard);
        setFlash({
          message: `${payload.firstName} ${payload.lastName} a ete ajoute au foyer.`,
          tone: "green",
        });
        setIsAddMemberOpen(false);
      });
    } catch (error) {
      setFlash({
        message: error instanceof Error ? error.message : "Impossible d'ajouter ce profil pour le moment.",
        tone: "red",
      });
    } finally {
      setIsSubmittingAddMember(false);
    }
  }

  function renderActiveSection() {
    if (!data) {
      return <InfoBox tone={loadError ? "orange" : "blue"}>{loadError ?? "Chargement du foyer..."}</InfoBox>;
    }

    switch (activeTab) {
      case "welcome":
        return (
          <FamilyWelcomeSection
            data={data}
            onAddProfile={openAddMember}
            onLostPassRequested={openLostPass}
          />
        );
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
            description="Aucun titre n'est rattache automatiquement : choisissez une offre ou ajoutez un titre uniquement quand la demarche est lancee."
            members={data.members}
            sectionId="titles"
            title="Titres et offres du foyer"
          />
        );
      case "services":
        return (
          <div className="grid gap-12">
            <SosNavigoSection
              onDeclareLostPass={() => openLostPassFlow()}
              refreshSignal={sosRefreshSignal}
            />
            <FamilyQuickActions members={data.members} />
          </div>
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
            <SosNavigoSection
              onDeclareLostPass={() => openLostPassFlow()}
              refreshSignal={sosRefreshSignal}
            />
            <FamilyQuickActions members={data.members} />
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
      greeting={data ? `Bonjour ${data.manager.firstName}` : undefined}
      subtitle="Gerez les titres de votre foyer depuis un seul espace, avec des alertes, des profils et des actions adaptees a chaque situation."
      summaryItems={data ? buildSummaryItems(data) : ["Chargement du foyer"]}
      title="Mon foyer Navigo"
      userName={data?.manager.firstName ?? "Mon espace"}
    >
      <div className="grid gap-8">
        {isLoading ? (
          <InfoBox>Chargement du foyer et des prochaines actions...</InfoBox>
        ) : null}

        {flash ? <InfoBox tone={flash.tone}>{flash.message}</InfoBox> : null}

        {renderActiveSection()}
      </div>

      {isLostPassOpen ? (
        <LostPassFlow
          defaultMemberId={selectedMemberId}
          isOpen={isLostPassOpen}
          isSubmitting={isSubmittingLostPass}
          members={data?.members ?? []}
          onClose={() => setIsLostPassOpen(false)}
          onSubmit={handleLostPassSubmit}
        />
      ) : null}

      {isAddMemberOpen ? (
        <AddHouseholdMemberModal
          initialType={addMemberType}
          isOpen={isAddMemberOpen}
          isSubmitting={isSubmittingAddMember}
          onClose={() => setIsAddMemberOpen(false)}
          onSubmit={handleAddMemberSubmit}
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
