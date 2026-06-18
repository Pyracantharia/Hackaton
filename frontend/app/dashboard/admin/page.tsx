"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import {
  getAdminDashboard,
  getAdminFamilies,
  getAdminFamily,
  getAdminUser,
  getAdminUsers,
  searchAdminFamilies,
} from "@/lib/api/admin";
import type {
  AdminDashboardResponse,
  AdminFamilyDetail,
  AdminFamilySummary,
  AdminHouseholdStatus,
  AdminManagementDetail,
  AdminSearchResult,
  AdminUserRow,
  DashboardMemberProfileType,
  SubscriptionRequestStatus,
} from "@/lib/api/types";

type StoredUser = {
  firstName?: string;
  lastName?: string;
  role?: string;
};

type AdminView = "users" | "families";

const familyStatusLabels: Record<AdminHouseholdStatus, string> = {
  OK: "Stable",
  WAITING_DOCUMENTS: "Documents attendus",
  TO_REVIEW: "A verifier",
  BLOCKED: "Bloque",
  SUPPORT_OPEN: "SAV ouvert",
};

const profileTypeLabels: Record<DashboardMemberProfileType, string> = {
  MANAGER: "Gestionnaire",
  YOUNG: "Enfant / jeune",
  SENIOR: "Senior",
  OTHER: "Autre",
};

const requestStatusLabels: Record<SubscriptionRequestStatus, string> = {
  DRAFT: "Brouillon",
  WAITING_DOCUMENTS: "Documents attendus",
  UNDER_REVIEW: "En verification",
  PAYMENT_PENDING: "Paiement attendu",
  PAYMENT_CONFIRMED: "Paiement confirme",
  PAYMENT_CANCELLED: "Paiement annule",
  CONFIRMED: "Confirmee",
  ACTIVE: "Active",
  BLOCKED: "Bloquee",
  REJECTED: "Refusee",
  CANCELLED: "Annulee",
  EXPIRED: "Expiree",
};

function getStatusLabel(status: string) {
  if (status === "DRAFT") return "Brouillon";
  return status;
}

function parseStoredUser(value: string | null): StoredUser | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
}

function getAccessToken() {
  return localStorage.getItem("familyAccessToken");
}

function personName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function badgeTone(status: string): "blue" | "green" | "orange" | "red" {
  if (["OK", "ACTIVE", "CONFIRMED", "RESOLVED"].includes(status)) return "green";
  if (["BLOCKED", "LOST"].includes(status)) return "red";
  if (["WAITING_DOCUMENTS", "TO_REVIEW", "SUPPORT_OPEN", "UNDER_REVIEW", "OPEN", "IN_PROGRESS"].includes(status)) return "orange";
  return "blue";
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-md border border-neutral-light bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-neutral-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold text-idfm-anthracite">{value}</p>
    </article>
  );
}

function ManagementModal({
  detail,
  onClose,
}: {
  detail: AdminManagementDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-idfm-anthracite/50 px-4 py-8" role="dialog" aria-modal="true">
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-light bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase text-idfm-interaction">
              {detail.household?.customerNumber ?? "Compte interne"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-idfm-anthracite">
              {detail.identity.firstName} {detail.identity.lastName}
            </h2>
            <p className="mt-1 text-sm text-neutral-medium">
              {profileTypeLabels[detail.identity.type]} - {detail.identity.email}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <div className="grid gap-6 p-5">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Identite</h3>
              <p className="mt-3 text-sm text-neutral-medium">Role compte : {detail.identity.role}</p>
              <p className="mt-2 text-sm text-neutral-medium">Telephone : {detail.identity.phone || "non renseigne"}</p>
              <p className="mt-2 text-sm text-neutral-medium">Role foyer : {detail.householdRole}</p>
            </div>
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Foyer</h3>
              <p className="mt-3 text-sm text-neutral-medium">{detail.household?.name ?? "Aucun foyer rattache"}</p>
              <p className="mt-2 text-sm text-neutral-medium">{detail.household?.managerName ?? "Gestionnaire indisponible"}</p>
              <p className="mt-2 text-sm text-neutral-medium">{detail.household?.managerEmail ?? ""}</p>
            </div>
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Responsabilites</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.flags.isHolder ? <Badge tone="blue">Porteur</Badge> : null}
                {detail.flags.isPayer ? <Badge tone="green">Payeur</Badge> : null}
                {detail.flags.isLegalRepresentative ? <Badge tone="orange">Responsable legal</Badge> : null}
                {!detail.flags.isHolder && !detail.flags.isPayer && !detail.flags.isLegalRepresentative ? <Badge>Profil suivi</Badge> : null}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Profils lies</h3>
              <div className="mt-3 grid gap-2">
                {detail.profiles.length ? detail.profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-3 rounded border border-neutral-light p-3 text-sm">
                    <span>{profile.firstName} {profile.lastName}</span>
                    <Badge tone="blue">{profileTypeLabels[profile.profileType]}</Badge>
                  </div>
                )) : <p className="text-sm text-neutral-medium">Aucun profil rattache.</p>}
              </div>
            </div>

            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Titres et passes</h3>
              <div className="mt-3 grid gap-2">
                {detail.subscriptions.length ? detail.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded border border-neutral-light p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-idfm-anthracite">{subscription.productName}</span>
                      <Badge tone={badgeTone(subscription.status)}>{getStatusLabel(subscription.status)}</Badge>
                    </div>
                    <p className="mt-2 text-neutral-medium">
                      Passe : {subscription.passNumberMasked ?? "numero non disponible"}
                    </p>
                  </div>
                )) : <p className="text-sm text-neutral-medium">Aucun titre rattache.</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Demandes de souscription</h3>
              <div className="mt-3 grid gap-3">
                {detail.subscriptionRequests.length ? detail.subscriptionRequests.map((request) => (
                  <article key={request.id} className="rounded border border-neutral-light p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-idfm-anthracite">{request.offerName}</span>
                      <Badge tone={badgeTone(request.status)}>{requestStatusLabels[request.status]}</Badge>
                    </div>
                    <p className="mt-2 text-neutral-medium">
                      Dossier intelligent : {request.intelligentDossierEnabled ? "oui" : "non"} - renouvellement auto : {request.autoRenewalEnabled ? "oui" : "non"}
                    </p>
                    <p className="mt-2 text-neutral-medium">
                      Documents : {request.documents.length ? request.documents.map((document) => `${document.label} (${document.status})`).join(", ") : "aucun"}
                    </p>
                  </article>
                )) : <p className="text-sm text-neutral-medium">Aucune demande.</p>}
              </div>
            </div>

            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">SOS Navigo</h3>
              <div className="mt-3 grid gap-3">
                {detail.supportCases.length ? detail.supportCases.map((supportCase) => (
                  <article key={supportCase.id} className="rounded border border-neutral-light p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-idfm-anthracite">
                        {supportCase.type === "LOST_PASS" ? "Passe perdu" : "Passe trouve"}
                      </span>
                      <Badge tone={badgeTone(supportCase.status)}>{supportCase.status}</Badge>
                    </div>
                    <p className="mt-2 text-neutral-medium">{supportCase.description ?? supportCase.foundLocation ?? "Aucun detail"}</p>
                    <p className="mt-2 text-neutral-medium">Passe : {supportCase.passNumberMasked ?? "numero masque indisponible"}</p>
                  </article>
                )) : <p className="text-sm text-neutral-medium">Aucun dossier SOS Navigo.</p>}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-neutral-light p-4">
            <h3 className="font-bold text-idfm-anthracite">Dernieres actions</h3>
            <div className="mt-3 grid gap-2">
              {detail.history.length ? detail.history.slice(0, 8).map((event) => (
                <div key={event.id} className="flex flex-col gap-1 border-b border-neutral-light pb-2 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <span>{event.label}</span>
                  <span className="font-semibold text-neutral-medium">{formatDate(event.createdAt)}</span>
                </div>
              )) : <p className="text-sm text-neutral-medium">Aucune action recente.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [view, setView] = useState<AdminView>("users");
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [families, setFamilies] = useState<AdminFamilySummary[]>([]);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  const [familyDetails, setFamilyDetails] = useState<Record<string, AdminFamilyDetail>>({});
  const [managementDetail, setManagementDetail] = useState<AdminManagementDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userName = storedUser?.firstName ? `${storedUser.firstName} ${storedUser.lastName ?? ""}`.trim() : "Admin";

  useEffect(() => {
    const token = getAccessToken();
    const sessionUser = parseStoredUser(sessionStorage.getItem("familyUser"));

    if (!token || (sessionUser?.role !== "ADMIN" && sessionUser?.role !== "EMPLOYEE")) {
      router.replace("/admin/login");
      return;
    }

    async function loadData(activeToken: string) {
      try {
        const [dashboardResponse, usersResponse, familiesResponse] = await Promise.all([
          getAdminDashboard(activeToken),
          getAdminUsers(activeToken),
          getAdminFamilies(activeToken),
        ]);

        startTransition(() => {
          setStoredUser(sessionUser);
          setDashboard(dashboardResponse);
          setUsers(usersResponse);
          setFamilies(familiesResponse);
          setError(null);
          setIsLoading(false);
        });
      } catch (loadError) {
        startTransition(() => {
          setError(loadError instanceof Error ? loadError.message : "Chargement du back-office impossible.");
          setIsLoading(false);
        });
      }
    }

    void loadData(token);
  }, [router]);

  async function openManagementModal(id: string) {
    const token = getAccessToken();
    if (!token) return;

    try {
      setManagementDetail(await getAdminUser(token, id));
    } catch (modalError) {
      setError(modalError instanceof Error ? modalError.message : "Detail utilisateur introuvable.");
    }
  }

  async function toggleFamily(familyId: string) {
    const token = getAccessToken();
    if (!token) return;

    if (expandedFamilyId === familyId) {
      setExpandedFamilyId(null);
      return;
    }

    if (!familyDetails[familyId]) {
      const detail = await getAdminFamily(token, familyId);
      setFamilyDetails((current) => ({ ...current, [familyId]: detail }));
    }

    setExpandedFamilyId(familyId);
  }

  async function handleSearch() {
    const token = getAccessToken();
    if (!token || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchResults(await searchAdminFamilies(token, searchQuery));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Recherche impossible.");
    }
  }

  return (
    <DashboardLayout
      activeTab="admin"
      basePath="/dashboard/admin"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { label: "Administration" },
      ]}
      showHeaderAction={false}
      showTabs={false}
      subtitle="Consultation back-office des utilisateurs, foyers, titres, demandes et dossiers SOS Navigo."
      summaryItems={isLoading ? ["Chargement"] : ["Back-office Comutitres", `${users.length} utilisateurs`, `${families.length} familles`]}
      title="Back-office employe"
      userName={userName}
    >
      <div className="grid gap-6">
        {error ? <InfoBox tone="red">{error}</InfoBox> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-idfm-medium bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-idfm-anthracite">Demandes de titres</h2>
              <p className="mt-1 text-sm text-neutral-medium">
                Valider les justificatifs et créer les titres actifs après contrôle.
              </p>
            </div>
            <Link href="/admin/titles" className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus">
              Ouvrir les demandes
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-idfm-medium bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-idfm-anthracite">Centre SOS Navigo</h2>
              <p className="mt-1 text-sm text-neutral-medium">
                Retrouver un dossier, enregistrer un pass retrouve et notifier une famille.
              </p>
            </div>
            <Link href="/admin/sos-navigo" className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus">
              Ouvrir SOS Navigo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Familles" value={dashboard?.stats.familiesCount ?? 0} />
          <StatCard label="Profils" value={dashboard?.stats.profilesCount ?? 0} />
          <StatCard label="Demandes" value={dashboard?.stats.openSubscriptionRequestsCount ?? 0} />
          <StatCard label="Passes perdus" value={dashboard?.stats.lostPassesCount ?? 0} />
          <StatCard label="Passes trouves" value={dashboard?.stats.foundPassesCount ?? 0} />
          <StatCard label="A verifier" value={dashboard?.stats.dossiersToReviewCount ?? 0} />
        </section>

        <section className="rounded-md border border-neutral-light bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              className="min-h-12 rounded-md border border-neutral-light px-4 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
              placeholder="Rechercher nom, prenom, email, numero client, passe masque..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSearch();
              }}
            />
            <Button type="button" onClick={() => void handleSearch()}>
              Rechercher
            </Button>
          </div>
          {searchResults.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    if (result.id.startsWith("user:") || result.id.startsWith("member:")) {
                      void openManagementModal(result.id);
                    } else if (result.id) {
                      void toggleFamily(result.id);
                      setView("families");
                    }
                  }}
                  className="rounded-md border border-idfm-medium bg-idfm-light p-4 text-left"
                >
                  <p className="text-xs font-bold uppercase text-idfm-interaction">{result.customerNumber ?? "Compte interne"}</p>
                  <p className="mt-1 font-bold text-idfm-anthracite">
                    {result.name ?? `${result.firstName ?? ""} ${result.lastName ?? ""}`.trim()}
                  </p>
                  <p className="mt-1 text-sm text-neutral-medium">
                    {result.email ?? result.manager?.email ?? result.family?.name ?? "Resultat back-office"}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <nav className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("users")}
            className={`min-h-11 rounded-md border px-4 text-sm font-semibold ${view === "users" ? "border-idfm-interaction bg-idfm-interaction text-white" : "border-neutral-light bg-white text-idfm-interaction"}`}
          >
            Liste des utilisateurs
          </button>
          <button
            type="button"
            onClick={() => setView("families")}
            className={`min-h-11 rounded-md border px-4 text-sm font-semibold ${view === "families" ? "border-idfm-interaction bg-idfm-interaction text-white" : "border-neutral-light bg-white text-idfm-interaction"}`}
          >
            Vue famille
          </button>
        </nav>

        {view === "users" ? (
          <section className="overflow-hidden rounded-md border border-neutral-light bg-white shadow-sm">
            <div className="grid grid-cols-1 border-b border-neutral-light bg-neutral-xlight px-4 py-3 text-xs font-bold uppercase text-neutral-medium lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.9fr_1fr_1fr_auto]">
              <span>Nom</span>
              <span>Email</span>
              <span>Role</span>
              <span>Numero client</span>
              <span>Type</span>
              <span>Famille</span>
              <span>Action</span>
            </div>
            {users.length ? users.map((adminUser) => (
              <div key={adminUser.id} className="grid grid-cols-1 items-center gap-3 border-b border-neutral-light px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.9fr_1fr_1fr_auto]">
                <div>
                  <p className="font-bold text-idfm-anthracite">{adminUser.lastName}</p>
                  <p className="text-neutral-medium">{adminUser.firstName}</p>
                </div>
                <span className="text-neutral-medium">{adminUser.email || "n/a"}</span>
                <Badge tone={adminUser.role === "ADMIN" ? "orange" : "blue"}>{adminUser.role}</Badge>
                <span className="font-semibold text-idfm-interaction">{adminUser.customerNumber ?? "n/a"}</span>
                <span>{profileTypeLabels[adminUser.type]}</span>
                <span>{adminUser.family?.name ?? "Aucune"}</span>
                <Button type="button" variant="secondary" onClick={() => void openManagementModal(adminUser.id)}>
                  Gerer
                </Button>
              </div>
            )) : <div className="p-6"><EmptyState title="Aucun utilisateur" description="Les utilisateurs apparaîtront apres le seed." /></div>}
          </section>
        ) : null}

        {view === "families" ? (
          <section className="overflow-hidden rounded-md border border-neutral-light bg-white shadow-sm">
            {families.length ? families.map((family) => {
              const detail = familyDetails[family.id];
              const isExpanded = expandedFamilyId === family.id;

              return (
                <div key={family.id} className="border-b border-neutral-light last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void toggleFamily(family.id)}
                    className="grid w-full grid-cols-1 items-center gap-3 px-4 py-4 text-left text-sm hover:bg-neutral-xlight lg:grid-cols-[0.9fr_1.2fr_1.2fr_0.7fr_0.8fr_0.8fr_0.8fr]"
                  >
                    <span className="font-bold text-idfm-interaction">{family.customerNumber}</span>
                    <span className="font-bold text-idfm-anthracite">{personName(family.manager)}</span>
                    <span className="text-neutral-medium">{family.manager.email}</span>
                    <span>{family.profilesCount} profils</span>
                    <span>{family.openRequestsCount} demandes</span>
                    <span>{detail?.supportCases.length ?? "..." } SOS</span>
                    <Badge tone={badgeTone(family.status)}>{familyStatusLabels[family.status]}</Badge>
                  </button>
                  {isExpanded ? (
                    <div className="grid gap-3 bg-idfm-light px-4 py-4">
                      {detail?.members.length ? detail.members.map((member) => (
                        <div key={member.id} className="grid grid-cols-1 items-center gap-3 rounded-md border border-idfm-medium bg-white p-3 text-sm md:grid-cols-[1fr_1fr_1fr_auto]">
                          <span className="font-bold text-idfm-anthracite">{member.firstName} {member.lastName}</span>
                          <span>{profileTypeLabels[member.profileType]}</span>
                          <span className="text-neutral-medium">
                            {[
                              member.isHolder ? "porteur" : null,
                              member.isPayer ? "payeur" : null,
                              member.isLegalRepresentative ? "responsable legal" : null,
                            ].filter(Boolean).join(" / ") || "profil suivi"}
                          </span>
                          <Button type="button" variant="secondary" onClick={() => void openManagementModal(`member:${member.id}`)}>
                            Gerer
                          </Button>
                        </div>
                      )) : <p className="text-sm text-neutral-medium">Chargement des membres...</p>}
                    </div>
                  ) : null}
                </div>
              );
            }) : <div className="p-6"><EmptyState title="Aucune famille" description="Les familles apparaîtront apres inscription ou seed." /></div>}
          </section>
        ) : null}
      </div>

      <ManagementModal detail={managementDetail} onClose={() => setManagementDetail(null)} />
    </DashboardLayout>
  );
}
