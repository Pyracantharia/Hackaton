"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import type { NavigoPass, NavigoPassSupportType } from "@/lib/api/types";

type NavigoPassSectionProps = {
  pass: NavigoPass | null;
  memberName: string;
  onSwitchSupport: (targetSupport: NavigoPassSupportType) => Promise<NavigoPass>;
};

const supportLabels: Record<NavigoPassSupportType, string> = {
  PHYSICAL: "Pass physique",
  DIGITAL: "Pass numérique",
};

const statusLabels: Record<NavigoPass["status"], string> = {
  ACTIVE: "Actif",
  IN_PROGRESS: "En cours de traitement",
  DISABLED: "Désactivé",
};

export function NavigoPassSection({ pass, memberName, onSwitchSupport }: NavigoPassSectionProps) {
  const [currentPass, setCurrentPass] = useState(pass);
  const [side, setSide] = useState<"front" | "back">("front");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentPass) {
    return (
      <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-idfm-anthracite">Mon pass Navigo</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Aucun pass Navigo actif pour ce profil.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => {
            window.location.href = `/dashboard/family/titles/recommendation`;
          }}>
            Souscrire un titre
          </Button>
        </div>
      </section>
    );
  }

  const targetSupport: NavigoPassSupportType = currentPass.supportType === "PHYSICAL" ? "DIGITAL" : "PHYSICAL";
  const hasReachedLimit = currentPass.switchesRemainingThisMonth <= 0;
  const targetLabel = supportLabels[targetSupport];

  async function confirmSwitch() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const updatedPass = await onSwitchSupport(targetSupport);
      setCurrentPass(updatedPass);
      setMessage(`Support mis à jour : ${supportLabels[updatedPass.supportType]}.`);
      setIsConfirmOpen(false);
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Le changement de support a échoué.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Pass Navigo</p>
          <h2 className="mt-1 text-2xl font-bold text-idfm-anthracite">Mon pass Navigo</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">
            Visualisez le support utilisé pour ce profil et changez-le si nécessaire.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={currentPass.status === "ACTIVE" ? "green" : "orange"}>
            {statusLabels[currentPass.status]}
          </Badge>
          <Badge tone={currentPass.supportType === "DIGITAL" ? "blue" : "green"}>
            {supportLabels[currentPass.supportType]}
          </Badge>
        </div>
      </div>

      {message ? <div className="mt-4"><InfoBox tone="green">{message}</InfoBox></div> : null}
      {error ? <div className="mt-4"><InfoBox tone="orange">{error}</InfoBox></div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl bg-idfm-light p-4">
          <div className="mb-4 grid grid-cols-2 rounded-xl bg-white p-1 text-sm font-semibold">
            <button
              className={`rounded-lg px-3 py-2 ${side === "front" ? "bg-idfm-interaction text-white" : "text-idfm-interaction"}`}
              type="button"
              onClick={() => setSide("front")}
            >
              Recto
            </button>
            <button
              className={`rounded-lg px-3 py-2 ${side === "back" ? "bg-idfm-interaction text-white" : "text-idfm-interaction"}`}
              type="button"
              onClick={() => setSide("back")}
            >
              Verso
            </button>
          </div>

          {side === "front" ? (
            <div className="mx-auto flex max-w-52 justify-center">
              <Image
                alt={`Recto du pass Navigo de ${memberName}`}
                className="h-auto w-full rounded-2xl drop-shadow-xl"
                height={430}
                src="/assets/illustrations/navigo-card-vertical.png"
                width={270}
              />
            </div>
          ) : (
            <div className="mx-auto flex min-h-80 max-w-52 flex-col justify-between rounded-3xl border border-idfm-medium bg-white p-5 shadow-lg">
              <div>
                <div className="text-xl font-black text-idfm-interaction">navigo</div>
                <p className="mt-6 text-xs font-bold uppercase tracking-wide text-neutral-medium">Titulaire</p>
                <p className="text-lg font-bold text-idfm-anthracite">{currentPass.holderName}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-medium">Identifiant</p>
                <p className="font-semibold text-idfm-anthracite whitespace-nowrap">{currentPass.navigoNumberMasked}</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-medium">Support</p>
                  <p className="font-semibold text-idfm-anthracite">{supportLabels[currentPass.supportType]}</p>
                </div>
                <div aria-hidden="true" className="grid h-14 w-14 grid-cols-4 gap-1 rounded bg-idfm-light p-1">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span key={index} className={index % 3 === 0 ? "bg-idfm-focus" : "bg-white"} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] leading-4 text-neutral-medium">
                Support virtuel de démonstration. Aucune activation NFC réelle.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-5">
          <div className="grid gap-4 rounded-2xl bg-neutral-xlight p-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-medium">Titulaire</p>
              <p className="text-xl font-bold text-idfm-anthracite">{currentPass.holderName}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-sm font-bold uppercase tracking-wide text-neutral-medium">Titre associe</p>
                <p className="mt-2 text-lg font-semibold text-idfm-anthracite">{currentPass.productName}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-sm font-bold uppercase tracking-wide text-neutral-medium">ID Navigo</p>
                <p className="mt-2 inline-flex max-w-full rounded-xl bg-idfm-light px-3 py-2 font-mono text-lg font-semibold text-idfm-anthracite whitespace-nowrap">
                  {currentPass.navigoNumberMasked}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-medium">Changements de support</p>
              <p className="font-semibold text-idfm-anthracite">
                Il reste {currentPass.switchesRemainingThisMonth} changement(s) ce mois-ci.
              </p>
              <p className="mt-1 text-sm text-neutral-medium">
                Limite : {currentPass.monthlySwitchLimit} changements par mois et par pass.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-idfm-medium bg-idfm-light p-5">
            <h3 className="text-lg font-bold text-idfm-anthracite">{targetLabel}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              {targetSupport === "DIGITAL"
                ? "Votre titre sera disponible sur téléphone. Le pass physique pourra être désactivé pour éviter les doublons."
                : "Votre titre sera de nouveau associé à votre pass Navigo physique."}
            </p>
            {hasReachedLimit ? (
              <InfoBox tone="orange">
                Vous avez atteint la limite de 3 changements ce mois-ci. Le changement sera à nouveau possible le mois prochain.
              </InfoBox>
            ) : (
              <Button className="mt-4 w-full sm:w-auto" type="button" onClick={() => setIsConfirmOpen(true)}>
                {targetSupport === "DIGITAL" ? "Passer en numérique" : "Repasser en physique"}
              </Button>
            )}
          </div>

          {currentPass.history.length ? (
            <div>
              <h3 className="text-lg font-bold text-idfm-anthracite">Historique récent</h3>
              <ul className="mt-3 grid gap-2 text-sm text-neutral-medium">
                {currentPass.history.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-neutral-light px-4 py-3">
                    {supportLabels[entry.previousSupport]} → {supportLabels[entry.newSupport]}
                    <span className="block text-xs uppercase tracking-wide">
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-idfm-anthracite/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
            <h3 className="text-2xl font-bold text-idfm-anthracite">
              {targetSupport === "DIGITAL" ? "Passer au support numérique ?" : "Repasser sur pass physique ?"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">
              Cette action compte comme un changement de support mensuel.
            </p>
            <div className="mt-5 grid gap-3 rounded-2xl bg-neutral-xlight p-4 text-sm">
              <p><span className="font-semibold">Support actuel :</span> {supportLabels[currentPass.supportType]}</p>
              <p><span className="font-semibold">Nouveau support :</span> {targetLabel}</p>
              <p>
                <span className="font-semibold">Après confirmation :</span>{" "}
                {Math.max(currentPass.switchesRemainingThisMonth - 1, 0)} changement(s) restant(s).
              </p>
            </div>
            <p className="mt-4 text-sm text-neutral-medium">
              Vous pouvez changer de support jusqu’à 3 fois par mois.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => setIsConfirmOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={confirmSwitch}>
                {isSubmitting ? "Changement..." : "Confirmer le changement"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
