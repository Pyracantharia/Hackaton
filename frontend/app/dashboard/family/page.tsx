"use client";

import { Suspense, startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { AddHouseholdMemberModal } from "@/components/organisms/AddHouseholdMemberModal";
import { AddMemberPanel } from "@/components/organisms/AddMemberPanel";
import { FamilyAlertsSection } from "@/components/organisms/FamilyAlertsSection";
import { FamilyHelpSection } from "@/components/organisms/FamilyHelpSection";
import { FamilyMembersSection } from "@/components/organisms/FamilyMembersSection";
import { FamilyProceduresSection } from "@/components/organisms/FamilyProceduresSection";
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
  getMyHouseholdProcedures,
  getRecoveredSupportAlerts,
  registerSupportCaseFinalChoice,
} from "@/lib/api/households";
import type {
  AddHouseholdMemberPayload,
  HouseholdDashboardResponse,
  HouseholdProcedure,
  LostPassPayload,
  LostPassResponse,
  RegisterMemberType,
  SupportCaseFinalChoice,
  SupportCaseSummary,
} from "@/lib/api/types";

type FlashMessage = {
  message: string;
  tone: "blue" | "green" | "orange" | "red";
};

type DashboardTabId = "welcome" | "overview" | "profiles" | "titles" | "services" | "demarches" | "alerts" | "help";

function getActiveTab(value: string | null): DashboardTabId {
  switch (value) {
    case "overview":
    case "profiles":
    case "titles":
    case "services":
    case "demarches":
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

function RecoveredPassModal({
  supportCase,
  isSubmitting,
  onClose,
  onChoose,
}: {
  supportCase: SupportCaseSummary | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChoose: (finalChoice: SupportCaseFinalChoice, digitalSupportRating: number) => void;
}) {
  const [rating, setRating] = useState(8);
  if (!supportCase) return null;
  const canReactivatePhysical = supportCase.status === "PASS_PICKED_UP";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-idfm-anthracite/50 px-4 py-8" role="dialog" aria-modal="true">
      <section className="w-full max-w-xl rounded-md bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-idfm-interaction">{supportCase.dossierNumber}</p>
            <h2 className="mt-1 text-2xl font-bold text-idfm-anthracite">
              {canReactivatePhysical ? "Choisir mon support" : "Choix digital definitif"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              {canReactivatePhysical
                ? `Confirmez comment vous souhaitez continuer pour ${supportCase.memberName ?? "ce profil"}.`
                : "Si vous ne passez pas au guichet, votre titre restera en digital et le pass physique pourra etre detruit par un agent."}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm font-semibold text-idfm-interaction hover:bg-idfm-light"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 rounded-md border border-neutral-light bg-neutral-xlight p-4 text-sm text-idfm-anthracite">
          <p><span className="font-semibold">Pass :</span> {supportCase.passNumberMasked ?? "****"}</p>
          <p className="mt-2"><span className="font-semibold">Guichet :</span> {supportCase.foundDeskName ?? supportCase.foundLocation ?? "Guichet indique"}</p>
          <p className="mt-2"><span className="font-semibold">Adresse :</span> {supportCase.foundDeskAddress ?? "Adresse communiquee par l'agent"}</p>
          {supportCase.pickupDeadlineAt ? (
            <p className="mt-2"><span className="font-semibold">Date limite :</span> {new Intl.DateTimeFormat("fr-FR").format(new Date(supportCase.pickupDeadlineAt))}</p>
          ) : null}
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-idfm-anthracite" htmlFor="digital-rating">
            Comment avez-vous trouve le support digital pendant la perte de votre pass ?
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="digital-rating"
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="w-full"
            />
            <span className="min-w-10 rounded-md bg-idfm-light px-3 py-2 text-center text-sm font-bold text-idfm-focus">
              {rating}/10
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => onChoose("DIGITAL_SUPPORT", rating)}
          >
            Rester sur support digital
          </Button>
          {canReactivatePhysical ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => onChoose("PHYSICAL_PASS_REACTIVATION", rating)}
            >
              Reactiver mon pass physique
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
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
  const [recoveredAlerts, setRecoveredAlerts] = useState<SupportCaseSummary[]>([]);
  const [procedures, setProcedures] = useState<HouseholdProcedure[]>([]);
  const [selectedRecoveredCase, setSelectedRecoveredCase] = useState<SupportCaseSummary | null>(null);
  const [isSubmittingRecoveredChoice, setIsSubmittingRecoveredChoice] = useState(false);
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

    void Promise.all([
      getMyHouseholdDashboard(accessToken),
      getRecoveredSupportAlerts(accessToken),
      getMyHouseholdProcedures(accessToken),
    ])
      .then(([dashboardResponse, alertsResponse, proceduresResponse]) => {
        startTransition(() => {
          setData(dashboardResponse);
          setRecoveredAlerts(alertsResponse);
          setProcedures(proceduresResponse.procedures);
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

  async function handleRecoveredFinalChoice(finalChoice: SupportCaseFinalChoice, digitalSupportRating: number) {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken || !selectedRecoveredCase) {
      setFlash({ message: "Reconnectez-vous pour confirmer la recuperation du pass.", tone: "red" });
      return;
    }

    setIsSubmittingRecoveredChoice(true);

    try {
      await registerSupportCaseFinalChoice(accessToken, selectedRecoveredCase.id, { finalChoice, digitalSupportRating });

      startTransition(() => {
        setRecoveredAlerts((current) => current.filter((supportCase) => supportCase.id !== selectedRecoveredCase.id));
        setSelectedRecoveredCase(null);
        setSosRefreshSignal((current) => current + 1);
        setFlash({
          message: finalChoice === "DIGITAL_SUPPORT"
            ? "Votre titre reste sur support digital. Votre choix definitif est enregistre."
            : "Votre pass physique est reactive.",
          tone: "green",
        });
      });
    } catch (error) {
      setFlash({
        message: error instanceof Error ? error.message : "Impossible d'enregistrer votre choix pour le moment.",
        tone: "red",
      });
    } finally {
      setIsSubmittingRecoveredChoice(false);
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
      case "demarches":
        return <FamilyProceduresSection members={data.members} procedures={procedures} />;
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

        {recoveredAlerts.length ? (
          <section className="grid gap-3 rounded-md border border-status-successLight bg-green-50 p-5 text-status-success">
            {recoveredAlerts.map((supportCase) => (
              <div key={supportCase.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase">Pass Navigo retrouve</p>
                  <h2 className="mt-1 text-xl font-bold">
                    {supportCase.status === "PASS_PICKED_UP"
                      ? `${supportCase.memberName ?? "Un profil du foyer"} doit choisir son support final`
                      : `${supportCase.memberName ?? "Un profil du foyer"} peut recuperer son pass`}
                  </h2>
                  <p className="mt-1 text-sm">
                    {supportCase.foundDeskName ?? supportCase.foundLocation ?? "Guichet indique"}
                    {supportCase.foundDeskAddress ? ` - ${supportCase.foundDeskAddress}` : ""} - {supportCase.passNumberMasked ?? "****"}
                    {supportCase.pickupDeadlineAt ? ` - avant le ${new Intl.DateTimeFormat("fr-FR").format(new Date(supportCase.pickupDeadlineAt))}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/family/support-cases/${supportCase.id}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-md border border-status-success bg-white px-5 text-sm font-semibold text-status-success transition hover:bg-green-100"
                  >
                    Voir le detail
                  </Link>
                  <Button type="button" onClick={() => setSelectedRecoveredCase(supportCase)}>
                    {supportCase.status === "PASS_PICKED_UP"
                      ? "Choisir mon support"
                      : "Garder le titre en digital"}
                  </Button>
                </div>
              </div>
            ))}
          </section>
        ) : null}

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

      <RecoveredPassModal
        supportCase={selectedRecoveredCase}
        isSubmitting={isSubmittingRecoveredChoice}
        onClose={() => setSelectedRecoveredCase(null)}
        onChoose={handleRecoveredFinalChoice}
      />
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
