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
  approveAdminSubscriptionRequest,
  getAdminSubscriptionRequest,
  getAdminSubscriptionRequests,
  rejectAdminSubscriptionRequest,
  updateAdminSubscriptionDocument,
} from "@/lib/api/admin";
import { buildApiUrl } from "@/lib/api";
import type {
  AdminSubscriptionDocumentPreview,
  AdminSubscriptionRequest,
  AdminSubscriptionRequestDetail,
  AdminSubscriptionRequestFilter,
  DashboardMemberProfileType,
  SubscriptionDocumentStatus,
  SubscriptionRequestStatus,
} from "@/lib/api/types";
import { getSubscriptionRequestStatusLabel } from "@/lib/subscription-status";

type StoredUser = {
  firstName?: string;
  lastName?: string;
  role?: string;
};

const filterLabels: Record<AdminSubscriptionRequestFilter, string> = {
  all: "Toutes",
  "to-review": "En attente de vérification",
  incomplete: "Documents incomplets",
  processing: "En cours",
  approved: "Validées",
  rejected: "Refusées",
  blocked: "Bloquées",
};

const profileTypeLabels: Record<DashboardMemberProfileType, string> = {
  MANAGER: "Adulte",
  YOUNG: "Enfant / étudiant",
  SENIOR: "Senior",
  OTHER: "Adulte",
};

const documentStatusLabels: Record<SubscriptionDocumentStatus, string> = {
  MISSING: "Manquant",
  READY: "À vérifier",
  UPLOADED: "Ajouté",
  UNDER_REVIEW: "À vérifier",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
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

function personName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function formatDate(value: string | null) {
  if (!value) return "Non renseigné";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Non renseigné";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAmount(value: number | null, currency = "EUR") {
  if (typeof value !== "number") return "Non estimé";

  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value / 100);
}

function badgeTone(status: SubscriptionRequestStatus | SubscriptionDocumentStatus): "blue" | "green" | "orange" | "red" {
  if (["ACTIVE", "CONFIRMED", "VALIDATED"].includes(status)) return "green";
  if (["REJECTED", "BLOCKED"].includes(status)) return "red";
  if (["WAITING_DOCUMENTS", "UNDER_REVIEW", "PAYMENT_PENDING", "MISSING", "READY", "UPLOADED"].includes(status)) return "orange";
  return "blue";
}

async function fetchDocumentPreview(accessToken: string, requestId: string, documentId: string) {
  const response = await fetch(
    buildApiUrl(`/api/admin/subscription-requests/${requestId}/documents/${documentId}/preview`),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = Array.isArray(data?.message)
      ? data.message.join(" ")
      : data?.message ?? "Aperçu indisponible.";

    throw new Error(message);
  }

  return response.json() as Promise<AdminSubscriptionDocumentPreview>;
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

function DetailLine({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="font-semibold text-neutral-medium">{label}</dt>
      <dd className="mt-1 text-idfm-anthracite">{value || "Non renseigné"}</dd>
    </div>
  );
}

function AddressBlock({ address }: { address: AdminSubscriptionRequestDetail["holder"]["address"] }) {
  if (!address) {
    return <p className="text-sm text-neutral-medium">Adresse non renseignée.</p>;
  }

  return (
    <p className="text-sm leading-6 text-idfm-anthracite">
      {[address.street, address.addressLine1, address.addressLine2, address.addressLine3].filter(Boolean).join(", ")}
      <br />
      {address.postalCode} {address.city}
      <br />
      {address.country ?? "France"}
    </p>
  );
}

function RequestModal({
  detail,
  isBusy,
  onClose,
  onDocumentStatus,
  onApprove,
  onReject,
}: {
  detail: AdminSubscriptionRequestDetail | null;
  isBusy: boolean;
  onClose: () => void;
  onDocumentStatus: (documentId: string, status: "VALIDATED" | "REJECTED" | "UNDER_REVIEW", reason?: string) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectingDocumentId, setRejectingDocumentId] = useState<string | null>(null);
  const [documentReason, setDocumentReason] = useState("");
  const [requestRejectReason, setRequestRejectReason] = useState("");
  const [previewDocument, setPreviewDocument] = useState<AdminSubscriptionRequestDetail["documents"][number] | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  if (!detail) return null;

  const requestId = detail.id;
  const canApprove = detail.documents.length > 0 && detail.documents.every((document) => document.status === "VALIDATED");

  function handleDocumentReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingDocumentId || !documentReason.trim()) return;
    onDocumentStatus(rejectingDocumentId, "REJECTED", documentReason.trim());
    setRejectingDocumentId(null);
    setDocumentReason("");
  }

  function handleRequestReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestRejectReason.trim()) return;
    onReject(requestRejectReason.trim());
    setRequestRejectReason("");
  }

  const previewIsImage = previewDataUrl?.startsWith("data:image/");

  async function openDocumentPreview(document: AdminSubscriptionRequestDetail["documents"][number]) {
    setPreviewDocument(document);
    setPreviewDataUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const preview = await fetchDocumentPreview(getAccessToken() ?? "", requestId, document.id);
      setPreviewDataUrl(preview.dataUrl);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Aperçu indisponible.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-idfm-anthracite/50 px-4 py-8" role="dialog" aria-modal="true">
      <section className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-md bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-light bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase text-idfm-interaction">{detail.dossierNumber}</p>
            <h2 className="mt-1 text-2xl font-bold text-idfm-anthracite">{personName(detail.member)} - {detail.offer.name}</h2>
            <p className="mt-1 text-sm text-neutral-medium">
              {detail.household.customerNumber} - {detail.household.ownerEmail}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <div className="grid gap-6 p-5">
          {detail.rejectionReason ? (
            <InfoBox tone={detail.status === "REJECTED" ? "red" : "orange"}>Motif enregistré : {detail.rejectionReason}</InfoBox>
          ) : null}

          <section className="rounded-md border border-neutral-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-idfm-anthracite">Informations générales</h3>
              <Badge tone={badgeTone(detail.status)}>{getSubscriptionRequestStatusLabel(detail.status)}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailLine label="Dossier" value={detail.dossierNumber} />
              <DetailLine label="Création" value={formatDate(detail.createdAt)} />
              <DetailLine label="Type de titre" value={detail.offer.productType} />
              <DetailLine label="Offre" value={detail.offer.name} />
              <DetailLine label="Montant estimé" value={formatAmount(detail.amounts.totalAmountCents, detail.amounts.currency)} />
              <DetailLine label="Renouvellement auto" value={detail.renewal.enabled ? "Activé" : "Non activé"} />
              <DetailLine label="Paiement simulé" value={detail.paymentSimulatedAt ? `Confirmé le ${formatDateTime(detail.paymentSimulatedAt)}` : "Non confirmé"} />
              <DetailLine label="Dernière revue" value={formatDateTime(detail.reviewedAt)} />
            </dl>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Titulaire du titre</h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <DetailLine label="Prénom" value={detail.holder.firstName} />
                <DetailLine label="Nom" value={detail.holder.lastName} />
                <DetailLine label="Date de naissance" value={formatDate(detail.holder.birthDate)} />
                <DetailLine label="Âge" value={detail.holder.age !== null ? `${detail.holder.age} ans` : null} />
                <DetailLine label="Profil" value={profileTypeLabels[detail.holder.profileType]} />
                <DetailLine label="Établissement" value={detail.holder.schoolName} />
                <DetailLine label="Niveau scolaire" value={detail.holder.schoolLevel} />
                <DetailLine label="Statut boursier" value={detail.holder.scholarshipStatus} />
              </dl>
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-neutral-medium">Adresse</p>
                <AddressBlock address={detail.holder.address} />
              </div>
            </div>

            <div className="rounded-md border border-neutral-light p-4">
              <h3 className="font-bold text-idfm-anthracite">Payeur</h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <DetailLine label="Prénom" value={detail.payer.firstName} />
                <DetailLine label="Nom" value={detail.payer.lastName} />
                <DetailLine label="Email" value={detail.payer.email} />
                <DetailLine label="Téléphone" value={detail.payer.phone} />
                <DetailLine label="Rôle" value={detail.payer.role} />
                <DetailLine label="Date de naissance" value={formatDate(detail.payer.birthDate)} />
              </dl>
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-neutral-medium">Adresse</p>
                <AddressBlock address={detail.payer.address} />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-neutral-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-idfm-anthracite">Justificatifs</h3>
              <span className="text-sm text-neutral-medium">{detail.documentCounts.validated}/{detail.documentCounts.total} validés</span>
            </div>
            <div className="mt-4 grid gap-3">
              {detail.documents.map((document) => (
                <article key={document.id} className="rounded-md border border-neutral-light p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div>
                      {(() => {
                        const hasPreview = Boolean(document.hasStoredFile || document.simulatedPreviewDataUrl);

                        return (
                          <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-idfm-anthracite">{document.label}</h4>
                        <Badge tone={badgeTone(document.status)}>{documentStatusLabels[document.status]}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-medium">
                        Type : {document.documentType} - Ajout : {formatDateTime(document.uploadedAt ?? null)}
                      </p>
                      <div className="mt-3 rounded-md border border-dashed border-neutral-light bg-neutral-xlight p-3 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-idfm-anthracite">{document.simulatedFileName ?? "Aucun fichier reçu"}</p>
                            <p className="mt-1 text-neutral-medium">
                              {document.simulatedMimeType ?? "En attente d'upload"}{document.simulatedSizeBytes ? ` - ${Math.round(document.simulatedSizeBytes / 1024)} Ko` : ""}
                            </p>
                          </div>
                          {hasPreview ? (
                            <Button type="button" variant="secondary" disabled={isBusy} onClick={() => void openDocumentPreview(document)}>
                              Voir l&apos;image
                            </Button>
                          ) : null}
                        </div>
                      </div>
                          </>
                        );
                      })()}
                      {document.rejectionReason ? <p className="mt-2 text-sm font-semibold text-status-danger">Motif : {document.rejectionReason}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button type="button" disabled={isBusy || document.status === "VALIDATED"} onClick={() => onDocumentStatus(document.id, "VALIDATED")}>
                        Valider
                      </Button>
                      <Button type="button" variant="secondary" disabled={isBusy} onClick={() => setRejectingDocumentId(document.id)}>
                        Refuser
                      </Button>
                      <Button type="button" variant="ghost" disabled={isBusy || document.status === "UNDER_REVIEW"} onClick={() => onDocumentStatus(document.id, "UNDER_REVIEW")}>
                        Repasser en attente
                      </Button>
                    </div>
                  </div>
                  {rejectingDocumentId === document.id ? (
                    <form className="mt-4 grid gap-3 rounded-md border border-status-danger bg-red-50 p-3" onSubmit={handleDocumentReject}>
                      <label className="text-sm font-bold text-idfm-anthracite" htmlFor={`reject-document-${document.id}`}>
                        Motif du refus
                      </label>
                      <textarea
                        id={`reject-document-${document.id}`}
                        className="min-h-24 rounded-md border border-neutral-light bg-white px-3 py-2 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
                        value={documentReason}
                        onChange={(event) => setDocumentReason(event.target.value)}
                        placeholder="Document illisible, expiré, incohérent..."
                        required
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={isBusy || !documentReason.trim()}>Confirmer le refus</Button>
                        <Button type="button" variant="ghost" onClick={() => setRejectingDocumentId(null)}>Annuler</Button>
                      </div>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-neutral-light p-4">
            <h3 className="font-bold text-idfm-anthracite">Décision dossier</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" disabled={isBusy || !canApprove || detail.status === "ACTIVE"} onClick={onApprove}>
                Valider la demande
              </Button>
              {!canApprove ? <InfoBox className="flex-1" tone="orange">Tous les justificatifs doivent être validés avant création du titre actif.</InfoBox> : null}
            </div>
            <form className="mt-4 grid gap-3 rounded-md border border-neutral-light bg-neutral-xlight p-4" onSubmit={handleRequestReject}>
              <label className="text-sm font-bold text-idfm-anthracite" htmlFor="request-reject-reason">
                Refuser la demande complète
              </label>
              <textarea
                id="request-reject-reason"
                className="min-h-24 rounded-md border border-neutral-light bg-white px-3 py-2 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
                value={requestRejectReason}
                onChange={(event) => setRequestRejectReason(event.target.value)}
                placeholder="Justificatifs non conformes, identité non vérifiable..."
                required
              />
              <div>
                <Button type="submit" variant="secondary" disabled={isBusy || !requestRejectReason.trim() || detail.status === "REJECTED"}>
                  Refuser la demande
                </Button>
              </div>
            </form>
          </section>
        </div>
      </section>

      {previewDocument ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-idfm-anthracite/70 px-4 py-8" role="dialog" aria-modal="true">
          <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-light bg-white p-4">
              <div>
                <p className="text-xs font-bold uppercase text-idfm-interaction">{previewDocument.documentType}</p>
                <h4 className="mt-1 text-xl font-bold text-idfm-anthracite">{previewDocument.label}</h4>
                <p className="mt-1 text-sm text-neutral-medium">{previewDocument.simulatedFileName ?? "Fichier simulé"}</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setPreviewDocument(null)}>
                Fermer
              </Button>
            </header>

            <div className="p-4">
              {isPreviewLoading ? (
                <InfoBox>Chargement de l&apos;image...</InfoBox>
              ) : previewIsImage && previewDataUrl ? (
                <div className="flex justify-center rounded-md border border-neutral-light bg-neutral-xlight p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Data URL previews cannot be optimized by next/image. */}
                  <img
                    src={previewDataUrl}
                    alt={`Aperçu du justificatif ${previewDocument.label}`}
                    className="max-h-[68vh] w-auto max-w-full rounded-md object-contain shadow-sm"
                  />
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-neutral-light bg-neutral-xlight p-8 text-center">
                  <p className="text-lg font-bold text-idfm-anthracite">Aperçu image indisponible</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-medium">
                    {previewError ?? "Ce dossier ne contient pas d'image prévisualisable. Le back-office dispose seulement des métadonnées du fichier simulé."}
                  </p>
                  <dl className="mx-auto mt-5 grid max-w-lg gap-3 text-left text-sm">
                    <DetailLine label="Nom du fichier" value={previewDocument.simulatedFileName} />
                    <DetailLine label="Type MIME" value={previewDocument.simulatedMimeType} />
                    <DetailLine label="Taille" value={previewDocument.simulatedSizeBytes ? `${Math.round(previewDocument.simulatedSizeBytes / 1024)} Ko` : null} />
                  </dl>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminTitlesPage() {
  const router = useRouter();
  const [storedUser] = useState<StoredUser | null>(() => {
    if (typeof window === "undefined") return null;
    return parseStoredUser(sessionStorage.getItem("familyUser"));
  });
  const [requests, setRequests] = useState<AdminSubscriptionRequest[]>([]);
  const [filter, setFilter] = useState<AdminSubscriptionRequestFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AdminSubscriptionRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "green" | "red" | "orange" | "blue"; text: string } | null>(null);

  const userName = useMemo(() => {
    if (!storedUser) return "Back-office";
    return `${storedUser.firstName ?? ""} ${storedUser.lastName ?? ""}`.trim() || "Back-office";
  }, [storedUser]);

  const stats = useMemo(() => ({
    total: requests.length,
    toReview: requests.filter((request) => request.status === "UNDER_REVIEW").length,
    blocked: requests.filter((request) => request.status === "BLOCKED").length,
    approved: requests.filter((request) => ["ACTIVE", "CONFIRMED"].includes(request.status)).length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
  }), [requests]);

  const refreshRequests = useCallback(async (
    accessToken = getAccessToken(),
    nextFilter: AdminSubscriptionRequestFilter = filter,
    nextQuery = query,
  ) => {
    if (!accessToken) return;
    const response = await getAdminSubscriptionRequests(accessToken, nextFilter, nextQuery);

    startTransition(() => {
      setRequests(response);
    });
  }, [filter, query]);

  useEffect(() => {
    const accessToken = getAccessToken();
    const user = storedUser;

    if (!accessToken || !user || !["ADMIN", "EMPLOYEE"].includes(user.role ?? "")) {
      router.replace("/admin/login");
      return;
    }

    void refreshRequests(accessToken, "all", "")
      .catch((error: Error) => setMessage({ tone: "red", text: error.message }))
      .finally(() => setIsLoading(false));
  }, [refreshRequests, router, storedUser]);

  useEffect(() => {
    if (isLoading) return;

    const timeoutId = window.setTimeout(() => {
      void refreshRequests(getAccessToken(), filter, query).catch((error: Error) => setMessage({ tone: "red", text: error.message }));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filter, query, isLoading, refreshRequests]);

  async function openRequest(id: string) {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setIsBusy(true);
    try {
      setSelectedRequest(await getAdminSubscriptionRequest(accessToken, id));
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Demande introuvable." });
    } finally {
      setIsBusy(false);
    }
  }

  async function mutateSelectedRequest(action: () => Promise<AdminSubscriptionRequestDetail>, success: string) {
    setIsBusy(true);
    try {
      const updated = await action();
      setSelectedRequest(updated);
      setMessage({ tone: "green", text: success });
      await refreshRequests(getAccessToken(), filter, query);
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Action impossible." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <DashboardLayout
      activeTab="admin"
      basePath="/dashboard/admin"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/admin", label: "Back-office" },
        { label: "Demandes de titres" },
      ]}
      showTabs={false}
      subtitle="Validation des demandes de souscription, justificatifs et création de titres actifs."
      summaryItems={["Demandes de titres", "Contrôle justificatifs", "Actions agent"]}
      title="Demandes de titres"
      userName={userName}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/admin" className="text-sm font-semibold text-idfm-interaction hover:underline">
            Retour au back-office
          </Link>
          <Button type="button" variant="secondary" onClick={() => void refreshRequests()}>
            Actualiser
          </Button>
        </div>

        {message ? <InfoBox tone={message.tone}>{message.text}</InfoBox> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Demandes" value={stats.total} helper="Résultat filtré" tone="blue" />
          <KpiCard label="À vérifier" value={stats.toReview} helper="Dossiers en revue" tone="orange" />
          <KpiCard label="Bloquées" value={stats.blocked} helper="Corrections client" tone="red" />
          <KpiCard label="Validées" value={stats.approved} helper="Titres actifs" tone="green" />
          <KpiCard label="Refusées" value={stats.rejected} helper="Décisions finales" tone="red" />
        </section>

        <section className="rounded-md border border-neutral-light bg-white p-4 shadow-sm">
          <label className="text-sm font-bold text-idfm-anthracite" htmlFor="title-request-search">
            Recherche nom, prénom, email, numéro client, dossier, type de titre
          </label>
          <input
            id="title-request-search"
            className="mt-2 min-h-12 w-full rounded-md border border-neutral-light px-4 text-sm outline-none focus:border-idfm-interaction focus:ring-2 focus:ring-idfm-medium"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Lucas, Martin, CF-..., IR-..., imagine R..."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(filterLabels) as AdminSubscriptionRequestFilter[]).map((candidate) => (
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
        </section>

        <section className="rounded-md border border-neutral-light bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-light p-4">
            <h2 className="text-lg font-bold text-idfm-anthracite">Demandes de souscription</h2>
            <span className="text-sm text-neutral-medium">{requests.length} dossiers</span>
          </div>

          {isLoading ? (
            <div className="p-4"><InfoBox>Chargement des demandes de titres...</InfoBox></div>
          ) : requests.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-neutral-xlight text-xs uppercase text-neutral-medium">
                  <tr>
                    <th className="px-4 py-3">Dossier</th>
                    <th className="px-4 py-3">Titulaire</th>
                    <th className="px-4 py-3">Payeur</th>
                    <th className="px-4 py-3">Titre demandé</th>
                    <th className="px-4 py-3">Profil</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Création</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-light">
                  {requests.map((request) => (
                    <tr key={request.id} className="align-top hover:bg-idfm-light/50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-idfm-interaction">{request.dossierNumber}</p>
                        <p className="mt-1 text-xs text-neutral-medium">{request.household.customerNumber}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-idfm-anthracite">{personName(request.member)}</p>
                        <p className="mt-1 text-xs text-neutral-medium">{request.household.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-4 text-neutral-medium">{personName(request.payer)}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-idfm-anthracite">{request.offer.name}</p>
                        <p className="mt-1 text-xs text-neutral-medium">{request.offer.productType}</p>
                      </td>
                      <td className="px-4 py-4">{profileTypeLabels[request.member.profileType]}</td>
                      <td className="px-4 py-4">
                        <Badge tone={badgeTone(request.status)}>{getSubscriptionRequestStatusLabel(request.status)}</Badge>
                      </td>
                      <td className="px-4 py-4 text-neutral-medium">
                        {request.documentCounts.validated}/{request.documentCounts.total}
                      </td>
                      <td className="px-4 py-4 text-neutral-medium">{formatDate(request.createdAt)}</td>
                      <td className="px-4 py-4 text-right">
                        <Button type="button" variant="secondary" onClick={() => void openRequest(request.id)}>
                          Gérer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState title="Aucune demande trouvée" description="Aucune demande de titre ne correspond aux filtres actifs." />
            </div>
          )}
        </section>
      </div>

      <RequestModal
        detail={selectedRequest}
        isBusy={isBusy}
        onClose={() => setSelectedRequest(null)}
        onDocumentStatus={(documentId, status, rejectionReason) => {
          if (!selectedRequest) return;
          void mutateSelectedRequest(
            () => updateAdminSubscriptionDocument(getAccessToken() ?? "", selectedRequest.id, documentId, { status, rejectionReason }),
            status === "REJECTED" ? "Justificatif refusé." : status === "VALIDATED" ? "Justificatif validé." : "Justificatif repassé en attente.",
          );
        }}
        onApprove={() => {
          if (!selectedRequest) return;
          void mutateSelectedRequest(
            () => approveAdminSubscriptionRequest(getAccessToken() ?? "", selectedRequest.id),
            "Demande validée et titre actif créé.",
          );
        }}
        onReject={(reason) => {
          if (!selectedRequest) return;
          void mutateSelectedRequest(
            () => rejectAdminSubscriptionRequest(getAccessToken() ?? "", selectedRequest.id, reason),
            "Demande refusée.",
          );
        }}
      />
    </DashboardLayout>
  );
}
