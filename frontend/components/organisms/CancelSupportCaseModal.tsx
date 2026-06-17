"use client";

import { Button } from "../atoms/Button";
import { FormError } from "../atoms/FormError";
import { InfoBox } from "../molecules/InfoBox";

type CancelSupportCaseModalProps = {
  dossierNumber: string;
  error?: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelSupportCaseModal({
  dossierNumber,
  error = "",
  isOpen,
  isSubmitting = false,
  onClose,
  onConfirm,
}: CancelSupportCaseModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-idfm-anthracite/55 px-0 sm:items-center sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Annuler la declaration"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h2 className="text-xl font-bold text-idfm-anthracite">Vous avez retrouve le pass ?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-medium">
          Vous pouvez annuler la declaration tant qu&apos;elle n&apos;a pas encore ete traitee par un agent.
        </p>

        <div className="mt-4">
          <InfoBox>
            Dossier <span className="font-semibold">{dossierNumber}</span>. Apres annulation, votre pass
            reste utilisable si aucune desactivation n&apos;a ete effectuee.
          </InfoBox>
        </div>

        {error ? (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Conserver la declaration
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? "Annulation..." : "Annuler ma declaration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
