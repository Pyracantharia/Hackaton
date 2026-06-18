"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { InfoBox } from "@/components/molecules/InfoBox";
import { ProfilePickerCard } from "@/components/molecules/ProfilePickerCard";
import { SubscriptionConfirmationTimeline } from "@/components/molecules/SubscriptionConfirmationTimeline";
import { SubscriptionStepper } from "@/components/molecules/SubscriptionStepper";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getMyHouseholdDashboard } from "@/lib/api/households";
import {
  createImagineRSubscriptionDraft,
  getSubscriptionRequest,
  submitImagineRSubscriptionDraft,
  updateImagineRSubscriptionDraft,
  uploadImagineRSubscriptionDocumentFile,
} from "@/lib/api/subscriptions";
import { getTitleOffers } from "@/lib/api/titles";
import type {
  DashboardMember,
  HouseholdDashboardResponse,
  ImagineRAddressPayload,
  ImagineRScholarshipStatus,
  ProductOffer,
  SchoolLevel,
  SubscriptionRequestResponse,
  UpdateImagineRSubscriptionPayload,
} from "@/lib/api/types";
import { familyDashboardMock } from "@/lib/demo/familyDashboardMock";
import { titleOffersMock } from "@/lib/demo/titleOffersMock";
import { getSubscriptionRequestStatusLabel } from "@/lib/subscription-status";

const steps = [
  "Profil",
  "Ancien forfait",
  "Client",
  "Information",
  "Titulaire",
  "Payeur",
  "Préférences",
  "Récapitulatif",
  "Signature",
  "Paiement",
  "Suivi",
];

const schoolLevelLabels: Record<SchoolLevel, string> = {
  PRIMARY: "Primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  HIGHER_EDUCATION: "Études supérieures",
  OTHER: "Autre",
};

const emptyAddress: ImagineRAddressPayload = {
  street: "",
  addressLine1: "",
  addressLine2: "",
  addressLine3: "",
  postalCode: "",
  city: "",
  country: "France",
};

const AGE_REFERENCE_DATE = new Date("2026-06-17T12:00:00.000Z");
const PAYER_INFO_STORAGE_KEY = "imagineRPayerInfo";

type FormState = {
  hasPreviousImagineR: boolean | null;
  hasCustomerNumber: boolean | null;
  customerNumber: string;
  infoCertificationAccepted: boolean;
  holderAddressSameAsPayer: boolean;
  holderAddress: ImagineRAddressPayload;
  payerBirthDate: string;
  payerAddress: ImagineRAddressPayload;
  schoolZipOrCity: string;
  schoolName: string;
  schoolLevel: SchoolLevel;
  scholarshipStatus: ImagineRScholarshipStatus;
  photoFile: { name: string; type: string; size: number; previewDataUrl: string | null; sourceFile?: File } | null;
  identityFile: { name: string; type: string; size: number; previewDataUrl: string | null; sourceFile?: File } | null;
  autoRenewalEnabled: boolean;
  signatureInformationAccepted: boolean;
  signaturePayerAccepted: boolean;
  signatureTermsAccepted: boolean;
  signatureDocumentsAccepted: boolean;
};

type SavedProgress = {
  draftId: string | null;
  form: FormState;
  selectedMemberId: string | null;
  selectedOfferId: string | null;
  step: number;
  updatedAt: string;
};

const PROGRESS_STORAGE_PREFIX = "imagineRSubscriptionProgress:";

function getRequestProgressKey(requestId: string) {
  return `${PROGRESS_STORAGE_PREFIX}request:${requestId}`;
}

function getSelectionProgressKey(memberId: string, offerId: string) {
  return `${PROGRESS_STORAGE_PREFIX}selection:${memberId}:${offerId}`;
}

function readSavedProgress(keys: Array<string | null>) {
  for (const key of keys) {
    if (!key) continue;

    try {
      const rawValue = localStorage.getItem(key);
      if (!rawValue) continue;

      const parsed = JSON.parse(rawValue) as SavedProgress;
      if (parsed?.form && typeof parsed.step === "number") {
        return parsed;
      }
    } catch {
      localStorage.removeItem(key);
    }
  }

  return null;
}

function removeSavedProgress(requestId: string | null, memberId: string | null, offerId: string | null) {
  if (requestId) {
    localStorage.removeItem(getRequestProgressKey(requestId));
  }

  if (memberId && offerId) {
    localStorage.removeItem(getSelectionProgressKey(memberId, offerId));
  }
}

function getAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = AGE_REFERENCE_DATE;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function defaultOfferForMember(member: DashboardMember | undefined, offers: ProductOffer[]) {
  const age = getAge(member?.birthDate ?? null);
  const productType = age !== null && age < 11 ? "IMAGINE_R_JUNIOR" : "IMAGINE_R_SCHOOL";
  return offers.find((offer) => offer.productType === productType) ?? offers.find((offer) => offer.productType === "IMAGINE_R_SCHOOL") ?? offers[0];
}

function centsToEuro(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value / 100);
}

function toDateInputValue(date: string | null) {
  if (!date) return "";
  return date.slice(0, 10);
}

function hasAddressValue(address: ImagineRAddressPayload) {
  return Boolean(address.street || address.postalCode || address.city);
}

function readStoredPayerInfo() {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(PAYER_INFO_STORAGE_KEY);
    return stored
      ? (JSON.parse(stored) as { payerBirthDate?: string; payerAddress?: ImagineRAddressPayload })
      : null;
  } catch {
    return null;
  }
}

function storePayerInfo(payerBirthDate: string, payerAddress: ImagineRAddressPayload) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    PAYER_INFO_STORAGE_KEY,
    JSON.stringify({
      payerBirthDate,
      payerAddress,
    }),
  );
}

function readPreviewDataUrl(file: File) {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function ensurePreviewDataUrl(file: FormState["photoFile"]) {
  if (!file) return null;
  if (file.previewDataUrl) return file.previewDataUrl;
  if (!file.sourceFile) return null;
  return readPreviewDataUrl(file.sourceFile);
}

function SectionCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-3xl border border-neutral-light bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-2xl font-bold text-idfm-anthracite">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function scrollToFormTop() {
  window.setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 50);
}

function scrollToErrorMessage() {
  window.setTimeout(() => {
    document.getElementById("imagine-r-error-message")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, 50);
}

function ChoiceCards({
  onChange,
  value,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { label: "Non", value: false },
        { label: "Oui", value: true },
      ].map((choice) => (
        <button
          key={choice.label}
          type="button"
          onClick={() => onChange(choice.value)}
          className={`min-h-24 rounded-2xl border p-5 text-center text-lg font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus ${
            value === choice.value ? "border-idfm-interaction bg-idfm-light text-idfm-focus" : "border-neutral-light bg-neutral-xlight text-idfm-anthracite hover:border-idfm-medium"
          }`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

function AddressForm({
  address,
  onChange,
}: {
  address: ImagineRAddressPayload;
  onChange: (address: ImagineRAddressPayload) => void;
}) {
  function update(field: keyof ImagineRAddressPayload, value: string) {
    onChange({ ...address, [field]: value });
  }

  return (
    <div className="grid gap-4">
      <Input label="Numéro et nom de rue" value={address.street} onChange={(event) => update("street", event.target.value)} />
      <Input label="Complément d'adresse 1" value={address.addressLine1 ?? ""} onChange={(event) => update("addressLine1", event.target.value)} />
      <Input label="Complément d'adresse 2" value={address.addressLine2 ?? ""} onChange={(event) => update("addressLine2", event.target.value)} />
      <Input label="Complément d'adresse 3" value={address.addressLine3 ?? ""} onChange={(event) => update("addressLine3", event.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Code postal" value={address.postalCode} onChange={(event) => update("postalCode", event.target.value)} />
        <Input label="Ville" value={address.city} onChange={(event) => update("city", event.target.value)} />
      </div>
      <Input label="Pays" value={address.country ?? "France"} onChange={(event) => update("country", event.target.value)} />
    </div>
  );
}

function UploadBox({
  file,
  label,
  onFile,
}: {
  file: FormState["photoFile"];
  label: string;
  onFile: (file: FormState["photoFile"]) => void;
}) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-idfm-interaction bg-white p-5 text-center transition hover:bg-idfm-light focus-within:ring-3 focus-within:ring-idfm-medium">
      <span className="text-lg font-bold text-idfm-interaction">{file ? file.name : label}</span>
      <span className="mt-2 text-sm text-neutral-medium">{file ? "Document ajouté pour la démo" : "Glissez-déposez ou chargez un fichier"}</span>
      <input
        type="file"
        className="sr-only"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (!selectedFile) {
            onFile(null);
            return;
          }

          void readPreviewDataUrl(selectedFile).then((previewDataUrl) => {
            onFile({
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              previewDataUrl,
              sourceFile: selectedFile,
            });
          });
        }}
      />
    </label>
  );
}

function ImagineRSubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<HouseholdDashboardResponse | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>(titleOffersMock);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(searchParams.get("memberId"));
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(searchParams.get("offerId"));
  const [draft, setDraft] = useState<SubscriptionRequestResponse | null>(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const bypassNavigationWarning = useRef(false);
  const [form, setForm] = useState<FormState>({
    hasPreviousImagineR: null,
    hasCustomerNumber: null,
    customerNumber: "",
    infoCertificationAccepted: false,
    holderAddressSameAsPayer: true,
    holderAddress: emptyAddress,
    payerBirthDate: "",
    payerAddress: emptyAddress,
    schoolZipOrCity: "",
    schoolName: "",
    schoolLevel: "COLLEGE",
    scholarshipStatus: "UNKNOWN",
    photoFile: null,
    identityFile: null,
    autoRenewalEnabled: false,
    signatureInformationAccepted: false,
    signaturePayerAccepted: false,
    signatureTermsAccepted: false,
    signatureDocumentsAccepted: false,
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");
    const requestId = searchParams.get("requestId");

    async function load() {
      try {
        let loadedRequest: SubscriptionRequestResponse | null = null;

        const [dashboardResponse, offersResponse] = await Promise.all([
          accessToken ? getMyHouseholdDashboard(accessToken) : Promise.resolve(familyDashboardMock),
          getTitleOffers().catch(() => titleOffersMock),
        ]);

        setDashboard(dashboardResponse);
        setOffers(offersResponse);

        if (requestId && accessToken) {
          const request = await getSubscriptionRequest(accessToken, requestId);
          loadedRequest = request;
          setDraft(request);
          setSelectedMemberId(request.member.id);
          setSelectedOfferId(request.offer.id);
          if (request.imagineR) {
            setForm((current) => ({
              ...current,
              hasPreviousImagineR: request.imagineR?.hasPreviousImagineR ?? current.hasPreviousImagineR,
              hasCustomerNumber: request.imagineR?.hasCustomerNumber ?? current.hasCustomerNumber,
              customerNumber: request.imagineR?.customerNumber ?? "",
              infoCertificationAccepted: request.imagineR?.infoCertificationAccepted ?? false,
              holderAddressSameAsPayer: request.imagineR?.holderAddressSameAsPayer ?? true,
              holderAddress: request.imagineR?.addresses.holder ?? current.holderAddress,
              payerBirthDate: toDateInputValue(request.imagineR?.payerBirthDate ?? null),
              payerAddress: request.imagineR?.addresses.payer ?? current.payerAddress,
              schoolZipOrCity: request.imagineR?.schoolZipOrCity ?? "",
              schoolName: request.imagineR?.schoolName ?? "",
              schoolLevel: request.imagineR?.schoolLevel ?? current.schoolLevel,
              scholarshipStatus: request.imagineR?.scholarshipStatus ?? "UNKNOWN",
              autoRenewalEnabled: request.renewal?.enabled ?? request.autoRenewalEnabled ?? false,
              signatureInformationAccepted: request.imagineR?.signatureInformationAccepted ?? false,
              signaturePayerAccepted: request.imagineR?.signaturePayerAccepted ?? false,
              signatureTermsAccepted: request.imagineR?.signatureTermsAccepted ?? false,
              signatureDocumentsAccepted: request.imagineR?.signatureDocumentsAccepted ?? false,
            }));
          }
        }

        const memberId = loadedRequest?.member.id ?? searchParams.get("memberId") ?? dashboardResponse.members.find((member) => member.profileType === "YOUNG")?.id ?? dashboardResponse.members[0]?.id ?? null;
        const member = dashboardResponse.members.find((candidate) => candidate.id === memberId);
        const offer = loadedRequest?.offer ?? offersResponse.find((candidate) => candidate.id === searchParams.get("offerId")) ?? defaultOfferForMember(member, offersResponse);
        const savedProgress =
          loadedRequest?.status === "DRAFT" || !loadedRequest
            ? readSavedProgress([
                loadedRequest ? getRequestProgressKey(loadedRequest.id) : null,
                member && offer ? getSelectionProgressKey(member.id, offer.id) : null,
              ])
            : null;

        setSelectedMemberId((current) => current ?? memberId);
        setSelectedOfferId((current) => current ?? offer?.id ?? null);
        const storedPayerInfo = readStoredPayerInfo();
        setForm((current) => ({
          ...current,
          schoolLevel: member?.schoolLevel ?? current.schoolLevel,
          payerBirthDate: current.payerBirthDate || storedPayerInfo?.payerBirthDate || "",
          payerAddress: hasAddressValue(current.payerAddress)
            ? current.payerAddress
            : storedPayerInfo?.payerAddress ?? current.payerAddress,
        }));

        if (savedProgress) {
          setSelectedMemberId(savedProgress.selectedMemberId ?? memberId);
          setSelectedOfferId(savedProgress.selectedOfferId ?? offer?.id ?? null);
          setStep(Math.min(Math.max(savedProgress.step, 0), steps.length - 2));
          setForm((current) => ({
            ...current,
            ...savedProgress.form,
            schoolLevel: savedProgress.form.schoolLevel ?? member?.schoolLevel ?? current.schoolLevel,
          }));
        } else {
          setForm((current) => ({
            ...current,
            schoolLevel: member?.schoolLevel ?? current.schoolLevel,
          }));
        }
      } catch (error) {
        setDashboard(familyDashboardMock);
        setMessage(error instanceof Error ? error.message : "Mode démo activé.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [searchParams]);

  const data = dashboard ?? familyDashboardMock;
  const youngMembers = data.members.filter((member) => member.profileType === "YOUNG");
  const selectedMember = youngMembers.find((member) => member.id === selectedMemberId) ?? youngMembers[0];
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? defaultOfferForMember(selectedMember, offers);
  const payer = data.members.find((member) => member.id === data.manager.id) ?? data.members[0];
  const age = getAge(selectedMember?.birthDate ?? null);
  const computedSituation =
    selectedMember?.schoolLevel === "HIGHER_EDUCATION"
      ? "Études supérieures"
      : age !== null && age < 11
        ? "Enfant de moins de 11 ans"
        : "Enfant scolarisé";
  const hasDraftInProgress = draft?.status === "DRAFT" && step < steps.length - 1;
  const progressStorageKey =
    draft?.id
      ? getRequestProgressKey(draft.id)
      : selectedMember && selectedOffer
        ? getSelectionProgressKey(selectedMember.id, selectedOffer.id)
        : null;

  useEffect(() => {
    if (!progressStorageKey || isLoading || step >= steps.length - 1) return;

    const progress: SavedProgress = {
      draftId: draft?.id ?? null,
      form,
      selectedMemberId: selectedMember?.id ?? selectedMemberId,
      selectedOfferId: selectedOffer?.id ?? selectedOfferId,
      step,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  }, [draft?.id, form, isLoading, progressStorageKey, selectedMember?.id, selectedMemberId, selectedOffer?.id, selectedOfferId, step]);

  useEffect(() => {
    if (!hasDraftInProgress) return;

    function beforeUnload(event: BeforeUnloadEvent) {
      if (bypassNavigationWarning.current) return;

      event.preventDefault();
      event.returnValue = "";
    }

    function confirmNavigation(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest("a[href]");

      if (!link || !(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) return;

      const targetUrl = new URL(link.href);
      if (targetUrl.origin !== window.location.origin) return;
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigationHref(link.href);
    }

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", confirmNavigation, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, [hasDraftInProgress]);

  function closeNavigationModal() {
    setPendingNavigationHref(null);
  }

  function confirmNavigation() {
    if (!pendingNavigationHref) return;

    bypassNavigationWarning.current = true;
    window.location.href = pendingNavigationHref;
  }

  async function ensureDraft() {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      throw new Error("Connectez-vous pour enregistrer le brouillon.");
    }

    if (!selectedMember || !selectedOffer) {
      throw new Error("Choisissez un enfant et une offre imagine R.");
    }

    if (draft) {
      return { accessToken, request: draft };
    }

    const request = await createImagineRSubscriptionDraft(accessToken, {
      householdMemberId: selectedMember.id,
      offerId: selectedOffer.id,
      payerMemberId: payer?.id,
    });
    setDraft(request);
    removeSavedProgress(null, selectedMember.id, selectedOffer.id);
    router.replace(`/dashboard/family/subscriptions/imagine-r/new?memberId=${selectedMember.id}&offerId=${selectedOffer.id}&requestId=${request.id}`);
    return { accessToken, request };
  }

  async function save(payload: UpdateImagineRSubscriptionPayload) {
    const { accessToken, request } = await ensureDraft();
    const updated = await updateImagineRSubscriptionDraft(accessToken, request.id, payload);
    setDraft(updated);
    return updated;
  }

  function setFormValue<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function next() {
    setIsSaving(true);
    setMessage(null);

    try {
      if (step === 0) {
        await ensureDraft();
      }
      if (step === 1) {
        if (form.hasPreviousImagineR === null) throw new Error("Choisissez Oui ou Non.");
        await save({ hasPreviousImagineR: form.hasPreviousImagineR });
      }
      if (step === 2) {
        if (form.hasCustomerNumber === null) throw new Error("Indiquez si vous avez déjà un numéro client.");
        await save({ hasCustomerNumber: form.hasCustomerNumber, customerNumber: form.customerNumber });
      }
      if (step === 3) {
        if (!form.infoCertificationAccepted) throw new Error("La certification est obligatoire pour commencer la souscription.");
        await save({ infoCertificationAccepted: true });
      }
      if (step === 4) {
        const addresses =
          form.holderAddressSameAsPayer
            ? []
            : [{ ...form.holderAddress, type: "HOLDER" as const }];
        await save({
          holderAddressSameAsPayer: form.holderAddressSameAsPayer,
          addresses,
        });
      }
      if (step === 5) {
        if (!form.payerAddress.street || !form.payerAddress.postalCode || !form.payerAddress.city) {
          throw new Error("Complétez l'adresse du payeur.");
        }
        await save({
          payerBirthDate: form.payerBirthDate || undefined,
          addresses: [{ ...form.payerAddress, type: "PAYER" }],
        });
        storePayerInfo(form.payerBirthDate, form.payerAddress);
      }
      if (step === 6) {
        if (!form.schoolZipOrCity || !form.schoolName) throw new Error("Renseignez l'établissement scolaire.");
        if (!form.photoFile || !form.identityFile) throw new Error("Ajoutez la photo et le justificatif d'identité pour continuer.");
        if (!form.photoFile.sourceFile || !form.identityFile.sourceFile) {
          throw new Error("Veuillez sélectionner à nouveau la photo et le justificatif d'identité pour envoyer les fichiers.");
        }
        const [photoPreviewDataUrl, identityPreviewDataUrl] = await Promise.all([
          ensurePreviewDataUrl(form.photoFile),
          ensurePreviewDataUrl(form.identityFile),
        ]);
        const updated = await save({
          schoolZipOrCity: form.schoolZipOrCity,
          schoolName: form.schoolName,
          imagineRSchoolLevel: form.schoolLevel,
          scholarshipStatus: form.scholarshipStatus,
          autoRenewalEnabled: form.autoRenewalEnabled,
          documents: [
            ...(form.photoFile
              ? [{
                  documentType: "PHOTO" as const,
                  label: "Photo du titulaire",
                  simulatedFileName: form.photoFile.name,
                  simulatedMimeType: form.photoFile.type,
                  simulatedSizeBytes: form.photoFile.size,
                  simulatedPreviewDataUrl: photoPreviewDataUrl ?? undefined,
                }]
              : []),
            ...(form.identityFile
              ? [{
                  documentType: "ID_DOCUMENT" as const,
                  label: "Justificatif d'identité",
                  simulatedFileName: form.identityFile.name,
                  simulatedMimeType: form.identityFile.type,
                  simulatedSizeBytes: form.identityFile.size,
                  simulatedPreviewDataUrl: identityPreviewDataUrl ?? undefined,
                }]
              : []),
          ],
        });
        const accessToken = localStorage.getItem("familyAccessToken");
        if (!accessToken) throw new Error("Connectez-vous pour envoyer les fichiers justificatifs.");
        await Promise.all([
          uploadImagineRSubscriptionDocumentFile(accessToken, updated.id, "PHOTO", form.photoFile.sourceFile),
          uploadImagineRSubscriptionDocumentFile(accessToken, updated.id, "ID_DOCUMENT", form.identityFile.sourceFile),
        ]);
        setDraft(await getSubscriptionRequest(accessToken, updated.id));
      }
      if (step === 8) {
        if (!form.signatureInformationAccepted || !form.signaturePayerAccepted || !form.signatureTermsAccepted || !form.signatureDocumentsAccepted) {
          throw new Error("Toutes les confirmations sont nécessaires.");
        }
        await save({
          signatureInformationAccepted: true,
          signaturePayerAccepted: true,
          signatureTermsAccepted: true,
          signatureDocumentsAccepted: true,
        });
      }
      if (step === 9) {
        const { accessToken, request } = await ensureDraft();
        const submitted = await submitImagineRSubscriptionDraft(accessToken, request.id);
        setDraft(submitted);
        removeSavedProgress(request.id, selectedMember?.id ?? null, selectedOffer?.id ?? null);
      }

      setStep((current) => Math.min(current + 1, steps.length - 1));
      scrollToFormTop();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer cette étape.");
      scrollToErrorMessage();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout activeTab="titles" breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Imagine R" }]} subtitle="Chargement du dossier." summaryItems={["Brouillon"]} title="Souscription imagine R" userName="Mon espace">
        <InfoBox>Chargement du parcours...</InfoBox>
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
        { label: "Imagine R" },
      ]}
      subtitle="Un parcours guidé pour créer une demande, sans créer d'abonnement actif automatiquement."
      summaryItems={[
        selectedMember ? `${selectedMember.firstName}, ${age ?? "-"} ans` : "Enfant à choisir",
        selectedOffer?.name ?? "Offre imagine R",
        draft ? getSubscriptionRequestStatusLabel(draft.status) : "Brouillon",
      ]}
      title="Souscription imagine R Scolaire ou Junior"
      userName={data.manager.firstName}
    >
      <div className="grid gap-8">
        <div className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
          <SubscriptionStepper currentStep={step} steps={steps} />
        </div>

        {message ? (
          <div id="imagine-r-error-message">
            <InfoBox tone="red" className="border-2">
              <strong className="block text-base">Une action est nécessaire pour continuer.</strong>
              <span className="mt-1 block">{message}</span>
            </InfoBox>
          </div>
        ) : null}

        {step === 0 ? (
          <SectionCard title="Pour quel enfant souhaitez-vous souscrire ?">
            <InfoBox className="mb-5">
              <strong>Repère d&apos;âge :</strong> le forfait Junior concerne les enfants de moins de 11 ans. Le forfait Scolaire
              concerne les élèves de 11 ans et plus, selon leur niveau et leur établissement.
            </InfoBox>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {youngMembers.map((member) => (
                <ProfilePickerCard
                  key={member.id}
                  isSelected={member.id === selectedMember?.id}
                  member={member}
                  onSelect={() => {
                    setSelectedMemberId(member.id);
                    const offer = defaultOfferForMember(member, offers);
                    setSelectedOfferId(offer?.id ?? null);
                    setForm((current) => ({ ...current, schoolLevel: member.schoolLevel ?? current.schoolLevel }));
                  }}
                />
              ))}
            </div>
            <InfoBox className="mt-5">Les informations connues du profil seront préremplies dans le dossier.</InfoBox>
          </SectionCard>
        ) : null}

        {step === 1 ? (
          <SectionCard title="L'élève disposait-il d'un forfait imagine R sur l'année scolaire 2025/2026 ?">
            <ChoiceCards value={form.hasPreviousImagineR} onChange={(value) => setFormValue("hasPreviousImagineR", value)} />
          </SectionCard>
        ) : null}

        {step === 2 ? (
          <SectionCard title="Avez-vous déjà un numéro client ?">
            <p className="mb-4 text-sm text-idfm-interaction">Où le trouver ? Il figure sur certains courriers ou contrats Navigo.</p>
            <ChoiceCards value={form.hasCustomerNumber} onChange={(value) => setFormValue("hasCustomerNumber", value)} />
            {form.hasCustomerNumber ? (
              <div className="mt-5 max-w-md">
                <Input label="Numéro client" value={form.customerNumber} onChange={(event) => setFormValue("customerNumber", event.target.value)} />
              </div>
            ) : null}
          </SectionCard>
        ) : null}

        {step === 3 ? (
          <SectionCard title="Avant de commencer">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
              <div className="space-y-5 text-base leading-7 text-neutral-medium">
                <p>
                  Les forfaits imagine R Scolaire et Junior sont annuels, toutes zones, réservés aux élèves résidant en Île-de-France.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBox>
                    <strong>Junior</strong>
                    <span className="mt-1 block">Moins de 11 ans : 17,20 € / an + 8 € de frais.</span>
                  </InfoBox>
                  <InfoBox>
                    <strong>Scolaire</strong>
                    <span className="mt-1 block">11 ans et plus, élève scolarisé : 393,30 € / an + 8 € de frais.</span>
                  </InfoBox>
                </div>
                <p>Le dossier est traité sous 10 jours maximum hors week-end et jours fériés.</p>
              </div>
              <div className="rounded-3xl bg-idfm-light p-5">
                <Badge tone="blue">Dossier suivi</Badge>
                <p className="mt-4 font-bold text-idfm-anthracite">Vous retrouverez l&apos;avancement depuis votre espace famille.</p>
              </div>
            </div>
            <div className="mt-6">
              <Checkbox
                checked={form.infoCertificationAccepted}
                label="Je certifie être majeur ou représentant légal, et titulaire légitime du moyen de paiement."
                onChange={(event) => setFormValue("infoCertificationAccepted", event.target.checked)}
              />
            </div>
          </SectionCard>
        ) : null}

        {step === 4 && selectedMember ? (
          <SectionCard title="Informations titulaire">
            <p className="text-sm text-neutral-medium">Ces informations proviennent du profil de {selectedMember.firstName}.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Prénom" value={selectedMember.firstName} readOnly className="bg-neutral-xlight" />
              <Input label="Nom" value={selectedMember.lastName} readOnly className="bg-neutral-xlight" />
              <Input label="Date de naissance" value={selectedMember.birthDate ?? ""} readOnly className="bg-neutral-xlight" />
              <Input label="Niveau scolaire" value={schoolLevelLabels[selectedMember.schoolLevel ?? form.schoolLevel]} readOnly className="bg-neutral-xlight" />
            </div>
            <div className="mt-6">
              <Checkbox
                checked={form.holderAddressSameAsPayer}
                label="Utiliser la même adresse que le payeur"
                description="Sinon, vous pouvez renseigner une adresse spécifique pour l'enfant."
                onChange={(event) => setFormValue("holderAddressSameAsPayer", event.target.checked)}
              />
            </div>
            {!form.holderAddressSameAsPayer ? (
              <div className="mt-5">
                <AddressForm address={form.holderAddress} onChange={(address) => setFormValue("holderAddress", address)} />
              </div>
            ) : null}
          </SectionCard>
        ) : null}

        {step === 5 ? (
          <SectionCard title="Informations payeur">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Prénom" value={payer?.firstName ?? data.manager.firstName} readOnly className="bg-neutral-xlight" />
              <Input label="Nom" value={payer?.lastName ?? data.manager.lastName} readOnly className="bg-neutral-xlight" />
              <Input label="Date de naissance" type="date" value={form.payerBirthDate} onChange={(event) => setFormValue("payerBirthDate", event.target.value)} />
            </div>
            <div className="mt-5">
              <AddressForm address={form.payerAddress} onChange={(address) => setFormValue("payerAddress", address)} />
            </div>
            <InfoBox className="mt-5">Pour un mineur, le payeur doit être majeur ou représentant légal.</InfoBox>
          </SectionCard>
        ) : null}

        {step === 6 ? (
          <SectionCard title="Préférences forfait">
            <div className="grid gap-8">
              <div>
                <h3 className="text-xl font-bold text-idfm-anthracite">Photo du titulaire</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <UploadBox file={form.photoFile} label="Charger une photo" onFile={(file) => setFormValue("photoFile", file)} />
                  <div className="rounded-2xl bg-idfm-light p-5 text-sm leading-6 text-neutral-medium">
                    Photo récente, de face, sur fond clair. Formats JPEG, PNG ou BMP.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl bg-neutral-xlight p-5">
                <h3 className="text-xl font-bold text-idfm-anthracite">Date de début et récupération</h3>
                <div className="rounded-2xl border border-idfm-interaction bg-white p-4">
                  <p className="font-bold text-idfm-focus">À partir du 1er septembre 2026</p>
                  <p className="mt-1 text-sm text-neutral-medium">Validité jusqu&apos;au 30 septembre 2027.</p>
                </div>
                <div className="rounded-2xl border border-idfm-interaction bg-white p-4">
                  <p className="font-bold text-idfm-focus">Au domicile du payeur</p>
                  <p className="mt-1 text-sm text-neutral-medium">Le passe sera envoyé après validation du dossier.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-idfm-medium bg-idfm-light p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">Optionnel</Badge>
                  <Badge tone="orange">Annulable</Badge>
                </div>
                <h3 className="mt-4 text-xl font-bold text-idfm-anthracite">Renouvellement automatique</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-medium">
                  Évitez l&apos;oubli à la prochaine rentrée. Vous recevrez un rappel et vous gardez la main.
                </p>
                <div className="mt-4">
                  <Checkbox
                    checked={form.autoRenewalEnabled}
                    label="Activer le renouvellement automatique"
                    description="Prochain renouvellement estimé : septembre 2027."
                    onChange={(event) => setFormValue("autoRenewalEnabled", event.target.checked)}
                  />
                </div>
                {form.autoRenewalEnabled ? (
                  <InfoBox className="mt-4">
                    Vous pourrez annuler avant l&apos;échéance. Des justificatifs pourront être redemandés si nécessaire,
                    sans refaire toute la souscription.
                  </InfoBox>
                ) : null}
              </div>

              <div>
                <h3 className="text-xl font-bold text-idfm-anthracite">Établissement scolaire</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="Code postal ou commune" placeholder="Ex : 75008 ou Paris 08" value={form.schoolZipOrCity} onChange={(event) => setFormValue("schoolZipOrCity", event.target.value)} />
                  <Input label="Établissement" placeholder="Renseigner l&apos;établissement" value={form.schoolName} onChange={(event) => setFormValue("schoolName", event.target.value)} />
                  <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
                    Niveau scolaire
                    <select
                      value={form.schoolLevel}
                      onChange={(event) => setFormValue("schoolLevel", event.target.value as SchoolLevel)}
                      className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                    >
                      {Object.entries(schoolLevelLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
                    Boursier
                    <select
                      value={form.scholarshipStatus}
                      onChange={(event) => setFormValue("scholarshipStatus", event.target.value as ImagineRScholarshipStatus)}
                      className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                    >
                      <option value="NO">Non</option>
                      <option value="YES">Oui</option>
                      <option value="UNKNOWN">Je ne sais pas encore</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-idfm-anthracite">Justificatif d&apos;identité</h3>
                <p className="mt-2 text-sm text-neutral-medium">Carte d&apos;identité, passeport ou acte de naissance.</p>
                <div className="mt-4">
                  <UploadBox file={form.identityFile} label="Joindre le document" onFile={(file) => setFormValue("identityFile", file)} />
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {step === 7 ? (
          <SectionCard title="Récapitulatif de votre demande">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Titulaire", `${selectedMember?.firstName} ${selectedMember?.lastName}`],
                ["Payeur", `${payer?.firstName ?? data.manager.firstName} ${payer?.lastName ?? data.manager.lastName}`],
                ["Offre", selectedOffer?.name ?? "Imagine R"],
                ["Situation", computedSituation],
                ["Début", "1er septembre 2026"],
                ["Récupération", "Au domicile du payeur"],
                ["Établissement", form.schoolName || "À compléter"],
                ["Renouvellement", form.autoRenewalEnabled ? "Activé — rappel avant septembre 2027" : "Non activé"],
                ["Montant estimé", centsToEuro(draft?.imagineR?.totalAmountCents ?? (selectedOffer?.productType === "IMAGINE_R_JUNIOR" ? 2520 : 40130))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-idfm-light p-4">
                  <p className="text-sm text-neutral-medium">{label}</p>
                  <p className="mt-1 font-bold text-idfm-anthracite">{value}</p>
                </div>
              ))}
            </div>
            <InfoBox className="mt-5">Votre dossier sera traité sous 10 jours maximum après validation.</InfoBox>
          </SectionCard>
        ) : null}

        {step === 8 ? (
          <SectionCard title="Signature et consentements">
            <div className="grid gap-3">
              <Checkbox checked={form.signatureInformationAccepted} label="Je certifie l'exactitude des informations renseignées." onChange={(event) => setFormValue("signatureInformationAccepted", event.target.checked)} />
              <Checkbox checked={form.signaturePayerAccepted} label="Je certifie être le payeur légitime ou le représentant légal." onChange={(event) => setFormValue("signaturePayerAccepted", event.target.checked)} />
              <Checkbox checked={form.signatureTermsAccepted} label="J'accepte les conditions générales d'utilisation du service." onChange={(event) => setFormValue("signatureTermsAccepted", event.target.checked)} />
              <Checkbox checked={form.signatureDocumentsAccepted} label="J'ai compris qu'une pièce non conforme peut entraîner le rejet de la demande." onChange={(event) => setFormValue("signatureDocumentsAccepted", event.target.checked)} />
            </div>
          </SectionCard>
        ) : null}

        {step === 9 ? (
          <SectionCard title="Paiement simulé">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-sm text-neutral-medium">Forfait</p>
                <p className="text-xl font-bold text-idfm-anthracite">{centsToEuro(draft?.imagineR?.baseAmountCents ?? (selectedOffer?.productType === "IMAGINE_R_JUNIOR" ? 1720 : 39330))}</p>
              </div>
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-sm text-neutral-medium">Frais de dossier</p>
                <p className="text-xl font-bold text-idfm-anthracite">8,00 €</p>
              </div>
              <div className="rounded-2xl border border-idfm-interaction bg-white p-4">
                <p className="text-sm text-neutral-medium">Total</p>
                <p className="text-2xl font-bold text-idfm-focus">{centsToEuro(draft?.imagineR?.totalAmountCents ?? (selectedOffer?.productType === "IMAGINE_R_JUNIOR" ? 2520 : 40130))}</p>
              </div>
            </div>
            <InfoBox className="mt-5">Cette étape est simulée pour la démonstration. Aucun paiement réel ne sera effectué.</InfoBox>
          </SectionCard>
        ) : null}

        {step === 10 && draft ? (
          <SectionCard title="Votre demande de souscription est enregistrée">
            <Badge tone="green">Dossier envoyé</Badge>
            <p className="mt-4 text-base leading-7 text-neutral-medium">
              Votre dossier imagine R a bien été créé. Vous pouvez suivre son avancement depuis votre espace famille.
            </p>
            <InfoBox className="mt-5">
              {draft.renewal?.enabled
                ? "Renouvellement automatique activé : vous recevrez un rappel avant la prochaine échéance et pourrez l'annuler depuis votre espace famille."
                : "Aucun renouvellement automatique activé. Vous pourrez l'activer plus tard depuis votre espace famille."}
            </InfoBox>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-sm text-neutral-medium">Numéro de dossier</p>
                <p className="font-bold text-idfm-anthracite">{draft.requestNumber ?? draft.id}</p>
              </div>
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-sm text-neutral-medium">Titulaire</p>
                <p className="font-bold text-idfm-anthracite">{draft.member.firstName} {draft.member.lastName}</p>
              </div>
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-sm text-neutral-medium">Statut</p>
                <p className="font-bold text-idfm-anthracite">{getSubscriptionRequestStatusLabel(draft.status)}</p>
              </div>
            </div>
            <div className="mt-6">
              <SubscriptionConfirmationTimeline timeline={draft.timeline} />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/family" className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white hover:bg-idfm-focus">
                Retour à mon espace famille
              </Link>
              <Link href={`/dashboard/family/subscriptions/${draft.id}/confirmation`} className="inline-flex min-h-12 items-center justify-center rounded-md border border-idfm-interaction bg-white px-5 text-sm font-semibold text-idfm-interaction hover:bg-idfm-light">
                Voir le suivi du dossier
              </Link>
            </div>
          </SectionCard>
        ) : null}

        {step < 10 ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(current - 1, 0))}>
              Retour
            </Button>
            <Button type="button" onClick={next} disabled={isSaving || !selectedMember || !selectedOffer}>
              {isSaving ? "Enregistrement..." : step === 9 ? "Confirmer la demande" : step === 8 ? "Signer et continuer" : "Continuer"}
            </Button>
          </div>
        ) : null}
      </div>

      {pendingNavigationHref ? (
        <div
          aria-labelledby="leave-subscription-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-idfm-anthracite/55 px-0 sm:items-center sm:px-5"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <Badge tone="orange">Démarche en cours</Badge>
            <h2 id="leave-subscription-title" className="mt-4 text-xl font-bold text-idfm-anthracite">
              Quitter cette souscription ?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Votre progression est sauvegardée automatiquement. Vous pourrez reprendre cette demande depuis votre espace famille.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={closeNavigationModal}>
                Continuer la démarche
              </Button>
              <Button type="button" onClick={confirmNavigation}>
                Quitter la page
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default function ImagineRSubscriptionPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement du parcours imagine R...</InfoBox>}>
      <ImagineRSubscriptionContent />
    </Suspense>
  );
}
