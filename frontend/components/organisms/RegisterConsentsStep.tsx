import { ConsentCard } from "../molecules/ConsentCard";
import type { ConsentsForm } from "../register/types";

type RegisterConsentsStepProps = {
  consents: ConsentsForm;
  onChange: (field: keyof ConsentsForm, value: boolean) => void;
};

export function RegisterConsentsStep({ consents, onChange }: RegisterConsentsStepProps) {
  return (
    <div className="grid gap-4">
      <ConsentCard
        checked={consents.serviceAlerts}
        description="Renouvellement, document refusé, paiement bloqué ou carte envoyée. Ces alertes servent au bon fonctionnement du service."
        disabled
        id="serviceAlerts"
        label="Alertes indispensables liées aux titres"
        onChange={(checked) => onChange("serviceAlerts", checked)}
        required
      />
      <ConsentCard
        checked={consents.mobilityNews}
        description="Rappels Imagine R, aides possibles et informations utiles selon votre situation."
        id="mobilityNews"
        label="Informations utiles sur les offres adaptées"
        onChange={(checked) => onChange("mobilityNews", checked)}
      />
      <ConsentCard
        checked={consents.partnerOffers}
        description="Communications commerciales et offres de partenaires. Cette option reste décochée par défaut."
        id="partnerOffers"
        label="Offres partenaires et communications commerciales"
        onChange={(checked) => onChange("partnerOffers", checked)}
      />
    </div>
  );
}
