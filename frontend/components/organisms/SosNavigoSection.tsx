"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "../atoms/Button";
import { InfoBox } from "../molecules/InfoBox";
import { QuickActionCard } from "../molecules/QuickActionCard";
import { SupportCaseCard } from "../molecules/SupportCaseCard";
import { CancelSupportCaseModal } from "./CancelSupportCaseModal";
import { cancelSupportCase, getMySupportCases } from "@/lib/api/households";
import type { SupportCaseSummary } from "@/lib/api/types";

type SosNavigoSectionProps = {
  onDeclareLostPass: () => void;
  refreshSignal?: number;
};

export function SosNavigoSection({ onDeclareLostPass, refreshSignal = 0 }: SosNavigoSectionProps) {
  const [cases, setCases] = useState<SupportCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const [caseToCancel, setCaseToCancel] = useState<SupportCaseSummary | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const loadCases = useCallback(async () => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setIsLoading(false);
      setLoadError("Connectez-vous pour retrouver vos declarations.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await getMySupportCases(accessToken);
      setCases(response.supportCases.filter((item) => item.type === "LOST_PASS"));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Impossible de charger vos declarations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases, refreshSignal]);

  useEffect(() => {
    if (refreshSignal > 0) {
      setShowList(true);
    }
  }, [refreshSignal]);

  async function handleConfirmCancel() {
    if (!caseToCancel) {
      return;
    }

    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setCancelError("Reconnectez-vous pour annuler la declaration.");
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      await cancelSupportCase(accessToken, caseToCancel.id);
      setCaseToCancel(null);
      await loadCases();
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "La declaration n'a pas pu etre annulee.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  const activeCases = cases.filter((item) => item.cancellable);

  return (
    <section id="sos-navigo" className="mt-12">
      <div className="rounded-[2rem] bg-idfm-light p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">SOS Navigo</p>
        <h2 className="mt-2 text-2xl font-bold text-idfm-anthracite">Un souci avec un pass ?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-medium">
          Declarez une perte, suivez une demande ou signalez un passe retrouve. On vous guide a chaque etape.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <QuickActionCard
            title="Declarer une carte perdue"
            description="Lancez le parcours guide pour declarer la perte d'un pass du foyer."
            onClick={onDeclareLostPass}
            imageSrc="/assets/illustrations/contactless-validator-round.png"
          />
          <QuickActionCard
            title="Voir mes declarations"
            description="Suivez l'etat de vos demandes et annulez si besoin."
            onClick={() => setShowList((current) => !current)}
            imageSrc="/assets/logos/pictogrammes/family-pictogram.png"
          />
          <QuickActionCard
            title="J'ai retrouve mon passe"
            description="Signalez un passe retrouve sans exposer son proprietaire."
            href="/found-pass"
            imageSrc="/assets/illustrations/hand-holding-ticket.png"
          />
        </div>
      </div>

      {showList ? (
        <div className="mt-6 grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-idfm-anthracite">Mes declarations</h3>
            <Button type="button" variant="ghost" onClick={() => void loadCases()}>
              Actualiser
            </Button>
          </div>

          {isLoading ? <InfoBox>Chargement de vos declarations...</InfoBox> : null}

          {!isLoading && loadError ? <InfoBox tone="orange">{loadError}</InfoBox> : null}

          {!isLoading && !loadError && cases.length === 0 ? (
            <InfoBox>Vous n&apos;avez aucune declaration de perte en cours.</InfoBox>
          ) : null}

          {activeCases.length > 0 ? (
            <InfoBox tone="blue">
              Vous avez retrouve le pass ? Vous pouvez annuler une declaration tant qu&apos;elle n&apos;a pas
              ete traitee par un agent.
            </InfoBox>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((supportCase) => (
              <SupportCaseCard
                key={supportCase.id}
                supportCase={supportCase}
                onCancel={(item) => {
                  setCancelError("");
                  setCaseToCancel(item);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <CancelSupportCaseModal
        dossierNumber={caseToCancel?.dossierNumber ?? ""}
        error={cancelError}
        isOpen={Boolean(caseToCancel)}
        isSubmitting={isCancelling}
        onClose={() => setCaseToCancel(null)}
        onConfirm={() => void handleConfirmCancel()}
      />
    </section>
  );
}
