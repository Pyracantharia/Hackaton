import { useState } from "react";
import { Button } from "../atoms/Button";
import { FormError } from "../atoms/FormError";
import type { DashboardMember } from "@/lib/api/types";

type LostPassModalProps = {
  defaultMemberId?: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  members: DashboardMember[];
  onClose: () => void;
  onSubmit: (payload: { memberId: string; reason: string }) => Promise<void> | void;
};

export function LostPassModal({
  defaultMemberId,
  isOpen,
  isSubmitting = false,
  members,
  onClose,
  onSubmit,
}: LostPassModalProps) {
  const availableMembers = members.filter((member) => member.profileType !== "SENIOR");
  const [memberId, setMemberId] = useState(defaultMemberId ?? availableMembers[0]?.id ?? "");
  const [reason, setReason] = useState("Carte perdue dans les transports");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  async function handleSubmit() {
    if (!memberId) {
      setError("Choisissez le profil concerne.");
      return;
    }

    if (!reason.trim()) {
      setError("Precisez le contexte de perte.");
      return;
    }

    setError("");
    await onSubmit({ memberId, reason: reason.trim() });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-idfm-anthracite/55 px-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-idfm-anthracite">Declarer une carte perdue</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-medium">
          Cette action peut bloquer le support actuel. Confirmez-vous la declaration de perte ?
        </p>

        <div className="mt-5 grid gap-4">
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium" htmlFor="lost-pass-member">
            Profil concerne
          </label>
          <select
            id="lost-pass-member"
            className="min-h-12 rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite outline-none transition focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
          >
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>

          <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium" htmlFor="lost-pass-reason">
            Contexte
          </label>
          <input
            id="lost-pass-reason"
            className="min-h-12 rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite outline-none transition focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <FormError message={error} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? "Creation..." : "Confirmer la perte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
