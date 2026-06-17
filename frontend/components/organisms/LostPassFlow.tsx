"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { FormError } from "../atoms/FormError";
import { ChoiceCard } from "../molecules/ChoiceCard";
import { InfoBox } from "../molecules/InfoBox";
import { ResolutionChoiceCard } from "../molecules/ResolutionChoiceCard";
import { StatusBadge } from "../molecules/StatusBadge";
import { StepIndicator } from "../molecules/StepIndicator";
import { SupportCaseTimeline } from "../molecules/SupportCaseTimeline";
import {
  formatSupportCaseDate,
  lostPassReasonLabels,
  resolutionLabels,
  simulateMaskedPass,
  supportCaseStatusLabels,
} from "@/lib/supportCases";
import type {
  DashboardMember,
  LostPassPayload,
  LostPassReason,
  LostPassResponse,
  SupportCaseResolution,
} from "@/lib/api/types";

type LostPassFlowProps = {
  defaultMemberId?: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  members: DashboardMember[];
  onClose: () => void;
  onSubmit: (payload: LostPassPayload) => Promise<LostPassResponse>;
};

const STEP_LABELS = ["Profil", "Raison", "Solution", "Confirmation"];

const REASON_OPTIONS: Array<{ value: LostPassReason; title: string; description: string }> = [
  { value: "LOST", title: "J'ai perdu mon pass", description: "Le pass est introuvable." },
  { value: "STOLEN", title: "Mon pass a ete vole", description: "Le pass a ete derobe." },
  { value: "DAMAGED", title: "Mon pass est endommage", description: "Le pass ne fonctionne plus." },
  { value: "UNKNOWN", title: "Je ne sais pas", description: "La situation n'est pas claire." },
];

function profileTypeLabel(profileType: DashboardMember["profileType"]) {
  switch (profileType) {
    case "MANAGER":
      return "Gestionnaire du foyer";
    case "YOUNG":
      return "Enfant / jeune";
    case "SENIOR":
      return "Senior / retraite";
    default:
      return "Profil accompagne";
  }
}

export function LostPassFlow({
  defaultMemberId,
  isOpen,
  isSubmitting = false,
  members,
  onClose,
  onSubmit,
}: LostPassFlowProps) {
  const singleMember = members.length === 1;
  const initialStep = singleMember ? 1 : 0;

  const [step, setStep] = useState(initialStep);
  const [memberId, setMemberId] = useState(defaultMemberId ?? members[0]?.id ?? "");
  const [reason, setReason] = useState<LostPassReason | null>(null);
  const [resolution, setResolution] = useState<SupportCaseResolution | null>(null);
  const [understands, setUnderstands] = useState(false);
  const [error, setError] = useState("");
  const [createdCase, setCreatedCase] = useState<LostPassResponse["supportCase"] | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(singleMember ? 1 : 0);
      setMemberId(defaultMemberId ?? members[0]?.id ?? "");
      setReason(null);
      setResolution(null);
      setUnderstands(false);
      setError("");
      setCreatedCase(null);
      setShowFinalConfirm(false);
    }
  }, [isOpen, defaultMemberId, singleMember, members]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === memberId) ?? null,
    [members, memberId],
  );

  if (!isOpen) {
    return null;
  }

  const titleLabel =
    selectedMember?.currentProduct ?? selectedMember?.recommendedProduct ?? null;
  const maskedPass = selectedMember ? simulateMaskedPass(selectedMember.id) : null;

  function goToReason(nextMemberId: string) {
    setMemberId(nextMemberId);
    setError("");
    setStep(1);
  }

  function selectReason(value: LostPassReason) {
    setReason(value);
    setError("");
    setStep(2);
  }

  function selectResolution(value: SupportCaseResolution) {
    setResolution(value);
    setError("");
    setStep(3);
  }

  async function handleConfirm() {
    if (!memberId || !reason || !resolution) {
      setError("Une etape est incomplete.");
      return;
    }

    if (!understands) {
      setError("Vous devez confirmer avoir compris la consequence.");
      return;
    }

    setError("");

    try {
      const response = await onSubmit({
        memberId,
        reason,
        chosenResolution: resolution,
        understandsDeactivation: true,
      });
      setShowFinalConfirm(false);
      setCreatedCase(response.supportCase);
      setStep(4);
    } catch (submitError) {
      setShowFinalConfirm(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "La declaration n'a pas pu etre enregistree.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-idfm-anthracite/55 px-0 sm:items-center sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Declarer un passe perdu"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-light p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-idfm-interaction">SOS Navigo</p>
            <h2 className="mt-1 text-xl font-bold text-idfm-anthracite sm:text-2xl">
              Declarer un passe perdu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-light text-neutral-medium transition hover:bg-neutral-xlight"
          >
            ✕
          </button>
        </div>

        {step < 4 ? (
          <div className="border-b border-neutral-light px-5 py-4">
            <StepIndicator currentStep={step} steps={STEP_LABELS} />
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Etape 1 — Profil */}
          {step === 0 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-idfm-anthracite">Quel pass avez-vous perdu ?</h3>
                <p className="mt-1 text-sm text-neutral-medium">
                  Selectionnez le profil concerne par la perte.
                </p>
              </div>
              {members.length === 0 ? (
                <InfoBox tone="orange">Aucun profil n&apos;est rattache a votre foyer.</InfoBox>
              ) : (
                <div className="grid gap-3">
                  {members.map((member) => {
                    const memberTitle = member.currentProduct ?? member.recommendedProduct;
                    const alreadyDeclared = member.status === "LOST";
                    const canDeclare = member.hasActiveTitle && !alreadyDeclared;
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 rounded-2xl border border-neutral-light bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-idfm-anthracite">
                              {member.firstName} {member.lastName}
                            </p>
                            <StatusBadge status={member.status} />
                          </div>
                          <p className="mt-1 text-sm text-neutral-medium">
                            {profileTypeLabel(member.profileType)}
                          </p>
                          {member.hasActiveTitle && memberTitle ? (
                            <p className="mt-1 text-sm text-idfm-anthracite">
                              {memberTitle}
                              <span className="ml-2 text-neutral-medium">
                                Pass {simulateMaskedPass(member.id)}
                              </span>
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-neutral-medium">
                              Aucun pass actif rattache a ce profil.
                            </p>
                          )}
                          {alreadyDeclared ? (
                            <p className="mt-1 text-sm font-semibold text-idfm-interaction">
                              Une declaration est deja en cours pour ce profil.
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!canDeclare}
                          onClick={() => goToReason(member.id)}
                        >
                          {alreadyDeclared
                            ? "Deja declare"
                            : !member.hasActiveTitle
                              ? "Aucun pass"
                              : "Selectionner"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Etape 2 — Raison */}
          {step === 1 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-idfm-anthracite">Que s&apos;est-il passe ?</h3>
                <p className="mt-1 text-sm text-neutral-medium">
                  {selectedMember
                    ? `Profil concerne : ${selectedMember.firstName} ${selectedMember.lastName}.`
                    : "Choisissez la situation la plus proche."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {REASON_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    title={option.title}
                    description={option.description}
                    action="Choisir"
                    onClick={() => selectReason(option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Etape 3 — Resolution */}
          {step === 2 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-idfm-anthracite">Comment souhaitez-vous continuer ?</h3>
                <p className="mt-1 text-sm text-neutral-medium">
                  Choisissez la solution la plus adaptee. On vous guide.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResolutionChoiceCard
                  title="Transferer le titre sur mon telephone"
                  description="Votre titre est transfere sur votre telephone si le profil est compatible. Le pass physique est desactive pour eviter la fraude."
                  note="Transfert simule pour cette demonstration (MVP)."
                  ctaLabel="Effectuer le transfert"
                  selected={resolution === "TRANSFER_TO_PHONE"}
                  onSelect={() => selectResolution("TRANSFER_TO_PHONE")}
                />
                <ResolutionChoiceCard
                  title="Desactiver le pass"
                  description="Le pass perdu est desactive pour le securiser, le temps de recevoir un nouveau support."
                  note="Cette option ne transfere pas votre titre. Elle securise simplement le pass perdu."
                  ctaLabel="Desactiver le pass"
                  selected={resolution === "DEACTIVATE_ONLY"}
                  onSelect={() => selectResolution("DEACTIVATE_ONLY")}
                />
              </div>
            </div>
          ) : null}

          {/* Etape 4 — Double confirmation */}
          {step === 3 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-idfm-anthracite">Confirmer la declaration de perte</h3>
                <p className="mt-1 text-sm text-neutral-medium">Verifiez le recapitulatif avant de confirmer.</p>
              </div>

              <dl className="grid gap-3 rounded-2xl border border-neutral-light bg-neutral-xlight p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Profil concerne</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {selectedMember
                      ? `${selectedMember.firstName} ${selectedMember.lastName}`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Titre concerne</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">{titleLabel ?? "Titre Navigo"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Numero de pass</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">{maskedPass ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Raison</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {reason ? lostPassReasonLabels[reason] : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Option choisie</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {resolution ? resolutionLabels[resolution] : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Consequence</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {resolution === "TRANSFER_TO_PHONE"
                      ? "Transfert telephone demande"
                      : "Pass desactive"}
                  </dd>
                </div>
              </dl>

              <InfoBox tone="orange">
                Une fois confirmee, cette declaration peut entrainer la desactivation du pass physique.
                Vous pourrez annuler la declaration uniquement tant qu&apos;elle n&apos;est pas traitee par un agent.
              </InfoBox>

              <Checkbox
                name="lost-pass-understands"
                checked={understands}
                onChange={(event) => setUnderstands(event.target.checked)}
                label="Je comprends que le pass physique pourra etre desactive."
              />
            </div>
          ) : null}

          {/* Etape 5 — Confirmation */}
          {step === 4 && createdCase ? (
            <div className="grid gap-5">
              <InfoBox tone="green">Votre declaration a bien ete enregistree.</InfoBox>

              <div className="grid gap-3 rounded-2xl border border-neutral-light bg-neutral-xlight p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-medium">Numero de dossier</span>
                  <span className="font-semibold text-idfm-anthracite">{createdCase.dossierNumber}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-medium">Date</span>
                  <span className="font-semibold text-idfm-anthracite">
                    {formatSupportCaseDate(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-medium">Statut</span>
                  <span className="font-semibold text-idfm-anthracite">
                    {supportCaseStatusLabels[createdCase.status]}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-medium">Profil concerne</span>
                  <span className="font-semibold text-idfm-anthracite">
                    {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-medium">Option choisie</span>
                  <span className="font-semibold text-idfm-anthracite">
                    {resolution ? resolutionLabels[resolution] : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-light bg-white p-4">
                <p className="mb-3 text-sm font-bold text-idfm-anthracite">Suivi de la demande</p>
                <SupportCaseTimeline chosenResolution={resolution} status={createdCase.status} />
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <FormError message={error} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-neutral-light p-5">
          {step === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button
                type="button"
                disabled={!understands || isSubmitting}
                onClick={() => {
                  setError("");
                  setShowFinalConfirm(true);
                }}
              >
                {isSubmitting ? "Enregistrement..." : "Confirmer la declaration"}
              </Button>
            </div>
          ) : null}

          {step === 4 && createdCase ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/dashboard/family/support-cases/${createdCase.id}`}
                className="contents"
                onClick={onClose}
              >
                <Button type="button" className="w-full">Voir le suivi</Button>
              </Link>
              <Button type="button" variant="secondary" onClick={onClose}>
                Retour a mon espace
              </Button>
            </div>
          ) : null}

          {step !== 3 && step !== 4 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {step > initialStep ? (
                <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>
                  Retour
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={onClose}>
                  Annuler
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                Fermer
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Double verification finale avant action definitive */}
      {showFinalConfirm ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-idfm-anthracite/60 px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmation definitive"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-idfm-anthracite">
              {resolution === "TRANSFER_TO_PHONE"
                ? "Effectuer le transfert maintenant ?"
                : "Desactiver le pass maintenant ?"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              {resolution === "TRANSFER_TO_PHONE"
                ? "Votre pass physique sera immediatement desactive et votre titre transfere sur votre smartphone. Cette action est definitive."
                : "Votre pass physique sera desactive. Vous pourrez annuler tant qu'un agent n'a pas traite la demande."}
            </p>

            <div className="mt-3">
              <FormError message={error} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => setShowFinalConfirm(false)}
              >
                Retour
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => void handleConfirm()}>
                {isSubmitting
                  ? "Traitement..."
                  : resolution === "TRANSFER_TO_PHONE"
                    ? "Oui, effectuer le transfert"
                    : "Oui, desactiver le pass"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
