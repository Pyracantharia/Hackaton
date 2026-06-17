"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import {
  destroyAdminSosNavigoPass,
  getAdminSosNavigoCase,
  getAdminSosNavigoCases,
  getAdminSosNavigoDashboard,
  markAdminSosNavigoCasePickedUp,
  notifyAdminSosNavigoCase,
  registerAdminFoundPass,
  registerAdminSosNavigoFinalChoice,
} from "@/lib/api/admin";
import type {
  AdminSosDashboardResponse,
  AdminSosFilter,
  AdminSupportCase,
} from "@/lib/api/types";
import {
  finalChoiceLabels,
  formatSupportCaseDate,
  resolutionLabels,
  supportCaseStatusLabels,
  supportCaseStatusTones,
} from "@/lib/supportCases";

type StoredUser = {
  firstName?: string;
  lastName?: string;
  role?: string;
};

const filterLabels: Record<AdminSosFilter, string> = {
  all: "Toutes",
  active: "En cours",
  transfer: "Transfert telephone",
  deactivation: "Desactivation",
  found: "Pass retrouve",
  "waiting-pickup": "Attente recuperation",
  closed: "Cloture",
  cancelled: "Annule",
};

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

function personName(person?: { firstName: string; lastName: string } | null) {
  if (!person) return "Profil non rattache";
  return `${person.firstName} ${person.lastName}`.trim();
}

function formatDateTime(value: string | null) {
  if (!value) return "Non renseigne";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function KpiCard({ label, value, helper, tone = "blue" }: {
  label: string;
  value: string | number;
  helper: string;
  tone?: "blue" | "green" | "orange" | "red";
}) {
  const toneClasses = {
    blue: "border-idfm-medium bg-white text-idfm-focus",
    green: "border-status-successLight bg-green-50 text-status-success",
    orange: "border-status-warning bg-orange-50 text-idfm-anthracite",
    red: "border-status-danger bg-red-50 text-status-danger",
  };

  return (
    <article className={`rounded-md border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm opacity-80">{helper}</p>
    </article>
  );
}

function CaseTimeline({ supportCase }: { supportCase: AdminSupportCase }) {
  const events = [
    { label: "Declaration", value: supportCase.createdAt },
    { label: "Pass retrouve", value: supportCase.foundAt },
    { label: "Client notifie", value: supportCase.clientNotifiedAt },
    { label: "Pass recupere", value: supportCase.pickedUpAt },
    { label: "Choix final", value: supportCase.finalChoiceAt },
    { label: "Pass detruit", value: supportCase.passDestroyedAt },
    { label: "Cloture", value: supportCase.resolvedAt },
  ];

  return (
    <ol className="grid gap-3">
      {events.map((event) => (
        <li key={event.label} className="grid grid-cols-[auto_1fr] gap-3">
          <span className={`mt-1 h-3 w-3 rounded-full ${event.value ? "bg-status-success" : "bg-neutral-light"}`} />
          <div>
            <p className="text-sm font-semibold text-idfm-anthracite">{event.label}</p>
            <p className="text-xs text-neutral-medium">{event.value ? formatDateTime(event.value) : "A venir"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CaseModal({
  supportCase,
  isBusy,
  onClose,
  onNotify,
  onPickedUp,
  onFinalChoice,
  onDestroyPass,
}: {
  supportCase: AdminSupportCase | null;
  isBusy: boolean;
  onClose: () => void;
  onNotify: () => void;
  onPickedUp: () => void;
  onFinalChoice: (finalChoice: "DIGITAL_SUPPORT" | "PHYSICAL_PASS_REACTIVATION") => void;
  onDestroyPass: () => void;
}) {
  const [renderedAt] = useState(() => Date.now());
  if (!supportCase) return null;
  const isPickupLate = supportCase.pickupDeadlineAt
    ? new Date(supportCase.pickupDeadlineAt).getTime() < renderedAt && supportCase.status === "PASS_FOUND_WAITING_PICKUP"
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-idfm-anthracite/50 px-4 py-8" role="dialog" aria-modal="true">
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-light bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase text-idfm-interaction">{supportCase.dossierNumber}</p>
            <h2 className="mt-1 text-2xl font-bold text-idfm-anthracite">{personName(supportCase.member)}</h2>
            <p className="mt-1 text-sm text-neutral-medium">
              {supportCase.household?.customerNumber ?? "Dossier non rattache"} - {supportCase.passNumberMasked ?? "Pass non renseigne"}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-5">
            <section className="rounded-md border border-neutral-light p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-idfm-anthracite">Informations dossier</h3>
                <div className="flex flex-wrap gap-2">
                  {isPickupLate ? <Badge tone="red">En retard</Badge> : null}
                  <Badge tone={supportCaseStatusTones[supportCase.status]}>{supportCaseStatusLabels[supportCase.status]}</Badge>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-neutral-medium">Foyer</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.household?.name ?? "Non rattache"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Gestionnaire</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.household?.ownerName ?? "Non rattache"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Titre</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.member?.currentTitle?.productName ?? "Non renseigne"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Resolution initiale</dt>
                  <dd className="mt-1 text-idfm-anthracite">
                    {supportCase.chosenResolution ? resolutionLabels[supportCase.chosenResolution] : "Non renseignee"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Guichet</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.foundDeskName ?? supportCase.foundLocation ?? "Non renseigne"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Adresse</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.foundDeskAddress ?? "Non renseignee"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Date limite de retrait</dt>
                  <dd className="mt-1 text-idfm-anthracite">{formatDateTime(supportCase.pickupDeadlineAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Notification client</dt>
                  <dd className="mt-1 text-idfm-anthracite">
                    {supportCase.clientNotifiedAt ? `Envoyee le ${formatDateTime(supportCase.clientNotifiedAt)}` : "Non envoyee"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Choix final</dt>
                  <dd className="mt-1 text-idfm-anthracite">
                    {supportCase.finalChoice ? finalChoiceLabels[supportCase.finalChoice] : "Non renseigne"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Satisfaction digital</dt>
                  <dd className="mt-1 text-idfm-anthracite">
                    {supportCase.digitalSupportRating ? `${supportCase.digitalSupportRating}/10` : "Non renseignee"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Pass physique</dt>
                  <dd className="mt-1 text-idfm-anthracite">
                    {supportCase.passDestroyedAt
                      ? `Detruit le ${formatDateTime(supportCase.passDestroyedAt)}`
                      : supportCase.physicalPassReactivatedAt
                        ? `Reactive le ${formatDateTime(supportCase.physicalPassReactivatedAt)}`
                        : "En attente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-medium">Correspondance</dt>
                  <dd className="mt-1 text-idfm-anthracite">{supportCase.possibleMatch ?? "Aucune correspondance rattachee"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Actions agent</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {supportCase.status === "PASS_FOUND_WAITING_PICKUP" ? (
                  <>
                    <Button type="button" variant="secondary" disabled={isBusy || !supportCase.household} onClick={onNotify}>
                      Notifier client
                    </Button>
                    <Button type="button" disabled={isBusy} onClick={onPickedUp}>
                      Marquer recupere au guichet
                    </Button>
                    <Button type="button" variant="ghost" disabled={isBusy} onClick={() => onFinalChoice("DIGITAL_SUPPORT")}>
                      Client reste en digital
                    </Button>
                  </>
                ) : null}

                {supportCase.status === "PASS_PICKED_UP" ? (
                  <>
                    <Button type="button" disabled={isBusy} onClick={() => onFinalChoice("PHYSICAL_PASS_REACTIVATION")}>
                      Remettre le titre sur pass physique
                    </Button>
                    <Button type="button" variant="secondary" disabled={isBusy} onClick={() => onFinalChoice("DIGITAL_SUPPORT")}>
                      Laisser le titre en digital
                    </Button>
                  </>
                ) : null}

                {supportCase.status === "DIGITAL_SUPPORT_CONFIRMED" && !supportCase.passDestroyedAt ? (
                  <Button type="button" variant="secondary" disabled={isBusy} onClick={onDestroyPass}>
                    Marquer le pass physique detruit
                  </Button>
                ) : null}

                {["TRANSFER_TO_PHONE_REQUESTED", "PASS_DEACTIVATION_REQUESTED"].includes(supportCase.status) ? (
                  <InfoBox className="w-full" tone="blue">
                    Pour faire evoluer ce dossier, utilisez le formulaire “Enregistrer un pass retrouve” avec le numero masque et le guichet.
                  </InfoBox>
                ) : null}

                {["DIGITAL_SUPPORT_CONFIRMED", "PHYSICAL_PASS_REACTIVATED", "RESOLVED", "CANCELLED_BY_USER"].includes(supportCase.status) ? (
                  <InfoBox className="w-full" tone="green">Dossier finalise. Aucune action agent necessaire.</InfoBox>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="rounded-md border border-neutral-light p-4">
            <h3 className="font-bold text-idfm-anthracite">Timeline</h3>
            <div className="mt-4">
              <CaseTimeline supportCase={supportCase} />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default function AdminSosNavigoPage() {
  const router = useRouter();
  const [storedUser] = useState<StoredUser | null>(() => {
    if (typeof window === "undefined") return null;
    return parseStoredUser(sessionStorage.getItem("familyUser"));
  });
  const [dashboard, setDashboard] = useState<AdminSosDashboardResponse | null>(null);
  const [cases, setCases] = useState<AdminSupportCase[]>([]);
  const [filter, setFilter] = useState<AdminSosFilter>("all");
  const [query, setQuery] = useState("");
  const [passNumber, setPassNumber] = useState("");
  const [deskName, setDeskName] = useState("");
  const [selectedCase, setSelectedCase] = useState<AdminSupportCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "green" | "red" | "orange"; text: string } | null>(null);

  const userName = useMemo(() => {
    if (!storedUser) return "Back-office";
    return `${storedUser.firstName ?? ""} ${storedUser.lastName ?? ""}`.trim() || "Back-office";
  }, [storedUser]);

  const refreshCases = useCallback(async (
    accessToken = getAccessToken(),
    nextFilter: AdminSosFilter = "all",
    nextQuery = "",
  ) => {
    if (!accessToken) return;
    const [dashboardResponse, casesResponse] = await Promise.all([
      getAdminSosNavigoDashboard(accessToken),
      getAdminSosNavigoCases(accessToken, nextFilter, nextQuery),
    ]);

    startTransition(() => {
      setDashboard(dashboardResponse);
      setCases(casesResponse);
    });
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    const user = storedUser;

    if (!accessToken || !user || !["ADMIN", "EMPLOYEE"].includes(user.role ?? "")) {
      router.replace("/admin/login");
      return;
    }

    void refreshCases(accessToken, "all", "")
      .catch((error: Error) => setMessage({ tone: "red", text: error.message }))
      .finally(() => setIsLoading(false));
  }, [refreshCases, router, storedUser]);

  useEffect(() => {
    if (isLoading) return;

    const timeoutId = window.setTimeout(() => {
      void refreshCases(getAccessToken(), filter, query).catch((error: Error) => setMessage({ tone: "red", text: error.message }));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filter, query, isLoading, refreshCases]);

  async function handleFoundPassSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/admin/login");
      return;
    }

    setIsBusy(true);
    try {
      const response = await registerAdminFoundPass(accessToken, {
        passNumber,
        deskName: deskName || undefined,
      });
      setPassNumber("");
      setMessage({
        tone: response.matched ? "green" : "orange",
        text: response.matched
          ? `Correspondance trouvee : ${response.supportCase.dossierNumber}.`
          : `Aucune declaration active : dossier ${response.supportCase.dossierNumber} cree.`,
      });
      await refreshCases(accessToken, filter, query);
      setSelectedCase(response.supportCase);
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Action impossible." });
    } finally {
      setIsBusy(false);
    }
  }

  async function openCase(id: string) {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setIsBusy(true);
    try {
      setSelectedCase(await getAdminSosNavigoCase(accessToken, id));
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Dossier introuvable." });
    } finally {
      setIsBusy(false);
    }
  }

  async function mutateSelectedCase(action: () => Promise<AdminSupportCase>, success: string) {
    setIsBusy(true);
    try {
      const updated = await action();
      setSelectedCase(updated);
      setMessage({ tone: "green", text: success });
      await refreshCases(getAccessToken(), filter, query);
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Action impossible." });
    } finally {
      setIsBusy(false);
    }
  }

  const stats = dashboard?.stats;

  return (
    <DashboardLayout
      activeTab="sos-navigo"
      basePath="/dashboard/admin"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/admin", label: "Back-office" },
        { label: "SOS Navigo" },
      ]}
      showTabs={false}
      subtitle="Suivi des pertes, passes retrouves, notifications client et recuperations au guichet."
      summaryItems={["Dossiers SOS Navigo", "Matching par pass masque", "Actions agent"]}
      title="SOS Navigo agent"
      userName={userName}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/admin" className="text-sm font-semibold text-idfm-interaction hover:underline">
            Retour au back-office
          </Link>
          <Button type="button" variant="secondary" onClick={() => void refreshCases()}>
            Actualiser
          </Button>
        </div>

        {message ? <InfoBox tone={message.tone}>{message.text}</InfoBox> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Dossiers actifs" value={stats?.activeCases ?? 0} helper="Pertes non cloturees" tone="orange" />
          <KpiCard label="Pass retrouves" value={stats?.foundTodayCount ?? 0} helper="Signales aujourd'hui" tone="green" />
          <KpiCard label="Attente guichet" value={stats?.waitingPickupCount ?? 0} helper="Clients a recuperer" tone="blue" />
          <KpiCard label="Taux cloture" value={`${stats?.resolutionRate ?? 0}%`} helper={`${stats?.averageDelayHours ?? 0}h moy.`} tone="green" />
          <KpiCard label="Satisfaction digital" value={stats?.digitalSupportSatisfaction ? `${stats.digitalSupportSatisfaction}/10` : "-"} helper="Note moyenne client" tone="blue" />
        </section>

        <section className="grid gap-4 rounded-md border border-neutral-light bg-white p-4 shadow-sm lg:grid-cols-[1fr_360px]">
          <div>
            <label className="text-sm font-bold text-idfm-anthracite" htmlFor="sos-search">
              Recherche dossier, client, profil, pass masque
            </label>
            <input
              id="sos-search"
              className="mt-2 min-h-12 w-full rounded-md border border-neutral-light px-4 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sophie, Lucas, SOS-2026, CF-..., ****1234"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as AdminSosFilter[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={`min-h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    filter === candidate
                      ? "border-idfm-interaction bg-idfm-interaction text-white"
                      : "border-neutral-light bg-white text-idfm-anthracite hover:bg-idfm-light"
                  }`}
                  onClick={() => setFilter(candidate)}
                >
                  {filterLabels[candidate]}
                </button>
              ))}
            </div>
          </div>

          <form className="rounded-md border border-neutral-light bg-neutral-xlight p-4" onSubmit={handleFoundPassSubmit}>
            <h2 className="font-bold text-idfm-anthracite">Enregistrer un pass retrouve</h2>
            <label className="mt-4 block text-sm font-semibold text-neutral-medium" htmlFor="found-pass-number">
              Numero ou pass masque
            </label>
            <input
              id="found-pass-number"
              className="mt-2 min-h-12 w-full rounded-md border border-neutral-light px-4 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
              value={passNumber}
              onChange={(event) => setPassNumber(event.target.value)}
              placeholder="****1234"
              required
            />
            <label className="mt-4 block text-sm font-semibold text-neutral-medium" htmlFor="found-desk">
              Guichet
            </label>
            <select
              id="found-desk"
              className="mt-2 min-h-12 w-full rounded-md border border-neutral-light bg-white px-4 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
              value={deskName}
              onChange={(event) => setDeskName(event.target.value)}
            >
              <option value="">Choix automatique</option>
              {dashboard?.desks.map((desk) => (
                <option key={desk.name} value={desk.name}>{desk.name}</option>
              ))}
            </select>
            <Button type="submit" className="mt-4 w-full" disabled={isBusy}>
              Enregistrer
            </Button>
          </form>
        </section>

        <section className="rounded-md border border-neutral-light bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-light p-4">
            <h2 className="text-lg font-bold text-idfm-anthracite">Demandes SOS Navigo</h2>
            <span className="text-sm text-neutral-medium">{cases.length} dossiers</span>
          </div>

          {isLoading ? (
            <div className="p-4"><InfoBox>Chargement des dossiers SOS Navigo...</InfoBox></div>
          ) : cases.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-neutral-xlight text-xs uppercase text-neutral-medium">
                  <tr>
                    <th className="px-4 py-3">Dossier</th>
                    <th className="px-4 py-3">Client / profil</th>
                    <th className="px-4 py-3">Pass</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Guichet</th>
                    <th className="px-4 py-3">Creation</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-light">
                  {cases.map((supportCase) => (
                    <tr key={supportCase.id} className="align-top hover:bg-idfm-light/50">
                      <td className="px-4 py-4 font-semibold text-idfm-anthracite">{supportCase.dossierNumber}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-idfm-anthracite">{personName(supportCase.member)}</p>
                        <p className="mt-1 text-xs text-neutral-medium">{supportCase.household?.customerNumber ?? "Non rattache"}</p>
                      </td>
                      <td className="px-4 py-4 font-mono text-idfm-anthracite">{supportCase.passNumberMasked ?? "****"}</td>
                      <td className="px-4 py-4">
                        <Badge tone={supportCaseStatusTones[supportCase.status]}>{supportCaseStatusLabels[supportCase.status]}</Badge>
                      </td>
                      <td className="px-4 py-4 text-neutral-medium">{supportCase.foundDeskName ?? supportCase.foundLocation ?? "-"}</td>
                      <td className="px-4 py-4 text-neutral-medium">{formatSupportCaseDate(supportCase.createdAt)}</td>
                      <td className="px-4 py-4 text-right">
                        <Button type="button" variant="secondary" onClick={() => void openCase(supportCase.id)}>
                          Gerer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Aucun dossier trouve"
                description="Aucun dossier SOS Navigo ne correspond aux filtres actifs."
              />
            </div>
          )}
        </section>
      </div>

      <CaseModal
        supportCase={selectedCase}
        isBusy={isBusy}
        onClose={() => setSelectedCase(null)}
        onNotify={() => {
          if (!selectedCase) return;
          void mutateSelectedCase(
            () => notifyAdminSosNavigoCase(getAccessToken() ?? "", selectedCase.id),
            "Client notifie.",
          );
        }}
        onPickedUp={() => {
          if (!selectedCase) return;
          void mutateSelectedCase(
            () => markAdminSosNavigoCasePickedUp(getAccessToken() ?? "", selectedCase.id),
            "Pass marque recupere au guichet.",
          );
        }}
        onFinalChoice={(finalChoice) => {
          if (!selectedCase) return;
          void mutateSelectedCase(
            () => registerAdminSosNavigoFinalChoice(getAccessToken() ?? "", selectedCase.id, { finalChoice }),
            "Choix final enregistre.",
          );
        }}
        onDestroyPass={() => {
          if (!selectedCase) return;
          void mutateSelectedCase(
            () => destroyAdminSosNavigoPass(getAccessToken() ?? "", selectedCase.id),
            "Pass physique marque detruit.",
          );
        }}
      />
    </DashboardLayout>
  );
}
