import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "../atoms/Badge";
import { EmptyState } from "../molecules/EmptyState";
import type { DashboardMember, HouseholdProcedure, HouseholdProcedureType } from "@/lib/api/types";

type FamilyProceduresSectionProps = {
  members: DashboardMember[];
  procedures: HouseholdProcedure[];
};

type ProcedureFilter = "ALL" | HouseholdProcedureType | "FINISHED";

const filters: Array<{ id: ProcedureFilter; label: string }> = [
  { id: "ALL", label: "Toutes" },
  { id: "SUBSCRIPTION", label: "Souscriptions" },
  { id: "RENEWAL", label: "Renouvellements" },
  { id: "SOS_NAVIGO", label: "SOS Navigo" },
  { id: "DOCUMENT", label: "Documents" },
  { id: "PAYMENT", label: "Paiements" },
  { id: "FINISHED", label: "Terminées" },
];

const typeLabels: Record<HouseholdProcedureType, string> = {
  DOCUMENT: "Document",
  FOUND_PASS: "Pass retrouvé",
  PAYMENT: "Paiement",
  RENEWAL: "Renouvellement",
  SOS_NAVIGO: "SOS Navigo",
  SUBSCRIPTION: "Souscription",
  SUPPORT_SWITCH: "Changement de support",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusTone(statusLabel: string): "blue" | "green" | "orange" | "red" {
  if (["Validée", "Terminée"].includes(statusLabel)) return "green";
  if (["Refusée", "Annulée"].includes(statusLabel)) return "red";
  if (["Brouillon", "À compléter", "En attente"].includes(statusLabel)) return "orange";
  return "blue";
}

function isFinished(procedure: HouseholdProcedure) {
  return ["Validée", "Terminée", "Refusée", "Annulée"].includes(procedure.statusLabel);
}

function getGroupKey(procedure: HouseholdProcedure) {
  return procedure.profileId ?? `household-${procedure.profileName}`;
}

function getLatestUpdatedAt(procedures: HouseholdProcedure[]) {
  return procedures.reduce((latest, procedure) => (
    new Date(procedure.updatedAt).getTime() > new Date(latest).getTime() ? procedure.updatedAt : latest
  ), procedures[0]?.updatedAt ?? new Date().toISOString());
}

export function FamilyProceduresSection({ members, procedures }: FamilyProceduresSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ProcedureFilter>("ALL");
  const [activeProfileId, setActiveProfileId] = useState("ALL");
  const [closedGroups, setClosedGroups] = useState<string[]>([]);

  const filteredProcedures = useMemo(() => procedures.filter((procedure) => {
    const matchesType =
      activeFilter === "ALL" ||
      (activeFilter === "FINISHED" ? isFinished(procedure) : procedure.type === activeFilter);
    const matchesProfile = activeProfileId === "ALL" || procedure.profileId === activeProfileId;

    return matchesType && matchesProfile;
  }), [activeFilter, activeProfileId, procedures]);

  const procedureGroups = useMemo(() => {
    const groups = new Map<string, { key: string; profileName: string; profileId: string | null; procedures: HouseholdProcedure[] }>();

    for (const procedure of filteredProcedures) {
      const key = getGroupKey(procedure);
      const group = groups.get(key);

      if (group) {
        group.procedures.push(procedure);
      } else {
        groups.set(key, {
          key,
          profileId: procedure.profileId,
          profileName: procedure.profileName,
          procedures: [procedure],
        });
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        latestUpdatedAt: getLatestUpdatedAt(group.procedures),
      }))
      .sort((first, second) => new Date(second.latestUpdatedAt).getTime() - new Date(first.latestUpdatedAt).getTime());
  }, [filteredProcedures]);

  function toggleGroup(groupKey: string) {
    setClosedGroups((current) => (
      current.includes(groupKey)
        ? current.filter((key) => key !== groupKey)
        : [...current, groupKey]
    ));
  }

  return (
    <section id="demarches" className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="blue">Démarches</Badge>
          <h2 className="mt-3 text-2xl font-bold text-idfm-anthracite">Suivi des démarches du foyer</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-medium">
            Retrouvez les demandes déjà lancées, leur statut et la prochaine action attendue.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-md border border-neutral-light bg-white p-4 shadow-sm lg:grid-cols-[1fr_16rem]">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                activeFilter === filter.id
                  ? "bg-idfm-interaction text-white"
                  : "bg-idfm-light text-idfm-focus hover:bg-idfm-medium"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
          Profil
          <select
            value={activeProfileId}
            onChange={(event) => setActiveProfileId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-neutral-medium bg-white px-3 text-sm text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
          >
            <option value="ALL">Tous les profils</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {procedureGroups.length ? (
        <div className="grid gap-4">
          {procedureGroups.map((group) => {
            const isOpen = !closedGroups.includes(group.key);
            const hasBlockingAction = group.procedures.some((procedure) => ["Brouillon", "À compléter", "En attente"].includes(procedure.statusLabel));
            const latestProcedure = group.procedures[0];

            return (
              <article
                key={group.key}
                className={`overflow-hidden rounded-md border bg-white shadow-sm ${
                  isOpen ? "border-idfm-medium" : "border-neutral-light"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                  className={`flex w-full flex-col gap-4 p-5 text-left transition hover:bg-idfm-light sm:flex-row sm:items-center sm:justify-between ${
                    isOpen ? "bg-idfm-light" : "bg-white"
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-idfm-interaction text-sm font-bold text-white">
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold text-idfm-anthracite">{group.profileName}</span>
                      <span className="mt-1 block text-sm leading-6 text-neutral-medium">
                        {group.procedures.length} démarche{group.procedures.length > 1 ? "s" : ""} suivie{group.procedures.length > 1 ? "s" : ""}
                        {" · "}Dernière mise à jour le {formatDate(group.latestUpdatedAt)}
                      </span>
                      {latestProcedure ? (
                        <span className="mt-1 block text-sm font-semibold text-idfm-focus">
                          Prochaine action : {latestProcedure.nextAction}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span className="flex flex-wrap gap-2 sm:justify-end">
                    {hasBlockingAction ? <Badge tone="orange">Action attendue</Badge> : <Badge tone="green">À jour</Badge>}
                    <Badge tone="blue">{group.procedures.length} dossier{group.procedures.length > 1 ? "s" : ""}</Badge>
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-neutral-light bg-white p-4 sm:p-5">
                    <div className="grid gap-3 border-l-4 border-idfm-medium pl-4">
                      {group.procedures.map((procedure) => (
                        <div key={procedure.id} className="rounded-md border border-neutral-light bg-neutral-xlight p-4">
                          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="blue">{typeLabels[procedure.type]}</Badge>
                                <Badge tone={getStatusTone(procedure.statusLabel)}>{procedure.statusLabel}</Badge>
                              </div>
                              <h3 className="mt-3 font-bold text-idfm-anthracite">{procedure.title}</h3>
                              {procedure.relatedTitle ? (
                                <p className="mt-1 text-sm text-neutral-medium">{procedure.relatedTitle}</p>
                              ) : null}
                            </div>

                            <dl className="grid gap-2 text-sm text-neutral-medium sm:grid-cols-2 lg:grid-cols-1">
                              <div>
                                <dt className="font-semibold text-idfm-anthracite">Créée le</dt>
                                <dd>{formatDate(procedure.createdAt)}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-idfm-anthracite">Mise à jour</dt>
                                <dd>{formatDate(procedure.updatedAt)}</dd>
                              </div>
                              <div className="sm:col-span-2 lg:col-span-1">
                                <dt className="font-semibold text-idfm-anthracite">Prochaine action</dt>
                                <dd>{procedure.nextAction}</dd>
                              </div>
                            </dl>

                            <Link
                              href={procedure.detailUrl}
                              className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
                            >
                              {procedure.statusLabel === "Brouillon" ? "Reprendre la démarche" : "Voir le détail"}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Aucune démarche à afficher"
          description="Les démarches lancées depuis votre foyer apparaîtront ici avec leur statut et la prochaine action."
        />
      )}
    </section>
  );
}
