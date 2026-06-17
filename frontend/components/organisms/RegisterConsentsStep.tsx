import { Badge } from "../atoms/Badge";
import { Checkbox } from "../atoms/Checkbox";
import type { ConsentsForm } from "../register/types";

type RegisterConsentsStepProps = {
  consents: ConsentsForm;
  onChange: (field: keyof ConsentsForm, value: boolean) => void;
};

type PreferenceRowProps = {
  badge: string;
  checked: boolean;
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onChange?: (checked: boolean) => void;
  tone?: "blue" | "green" | "orange";
};

function PreferenceRow({
  badge,
  checked,
  description,
  disabled,
  id,
  label,
  onChange,
  tone = "blue",
}: PreferenceRowProps) {
  return (
    <article className={`rounded-2xl border p-4 ${checked ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone={tone}>{badge}</Badge>
          <h2 className="mt-3 text-lg font-bold text-idfm-anthracite">{label}</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-medium">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-idfm-focus">
          {checked ? "Oui" : "Non"}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-white px-3 py-3">
        <Checkbox
          checked={checked}
          disabled={disabled}
          id={id}
          label={disabled ? "Toujours actif" : "Recevoir"}
          onChange={(event) => onChange?.(event.target.checked)}
        />
      </div>
    </article>
  );
}

export function RegisterConsentsStep({ consents, onChange }: RegisterConsentsStepProps) {
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-neutral-medium">
        Choisissez ce que vous voulez recevoir. Les alertes de service restent obligatoires.
      </p>

      <PreferenceRow
        badge="Obligatoire"
        checked={consents.serviceAlerts}
        description="Suivi du foyer : dossier, paiement, justificatif, carte."
        disabled
        id="serviceAlerts"
        label="Alertes importantes"
        tone="green"
      />

      <PreferenceRow
        badge="Utile"
        checked={consents.mobilityNews}
        description="Conseils adaptés aux profils ajoutés."
        id="mobilityNews"
        label="Conseils personnalisés"
        onChange={(checked) => onChange("mobilityNews", checked)}
      />

      <PreferenceRow
        badge="Optionnel"
        checked={consents.partnerOffers}
        description="Offres partenaires et communications commerciales."
        id="partnerOffers"
        label="Communications partenaires"
        onChange={(checked) => onChange("partnerOffers", checked)}
        tone="orange"
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-light bg-white p-4">
        <Badge tone="green">Service actif</Badge>
        <Badge tone={consents.mobilityNews ? "blue" : "orange"}>
          Conseils {consents.mobilityNews ? "oui" : "non"}
        </Badge>
        <Badge tone={consents.partnerOffers ? "blue" : "orange"}>
          Partenaires {consents.partnerOffers ? "oui" : "non"}
        </Badge>
      </div>
    </div>
  );
}
