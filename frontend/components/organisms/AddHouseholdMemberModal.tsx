import { useEffect, useMemo, useState } from "react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { InfoBox } from "../molecules/InfoBox";
import type {
  AddHouseholdMemberPayload,
  IdfDepartment,
  RegisterMemberType,
  SchoolLevel,
  SeniorRelationship,
} from "@/lib/api/types";
import { departmentLabels, schoolLevelLabels, seniorRelationshipLabels } from "../register/types";

type AddHouseholdMemberModalProps = {
  initialType: RegisterMemberType;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AddHouseholdMemberPayload) => void;
};

type Draft = {
  birthDate: string;
  department: IdfDepartment;
  firstName: string;
  lastName: string;
  schoolLevel: SchoolLevel;
  seniorRelationship: SeniorRelationship;
};

const emptyDraft: Draft = {
  birthDate: "",
  department: "94",
  firstName: "",
  lastName: "",
  schoolLevel: "COLLEGE",
  seniorRelationship: "PARENT",
};

function getAge(birthDate: string) {
  if (!birthDate) return null;

  const today = new Date();
  const date = new Date(birthDate);
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) ? age : null;
}

export function AddHouseholdMemberModal({
  initialType,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: AddHouseholdMemberModalProps) {
  const [selectedType, setSelectedType] = useState<RegisterMemberType>(initialType);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const draftAge = useMemo(() => getAge(draft.birthDate), [draft.birthDate]);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      setDraft(emptyDraft);
      setErrors({});
    }
  }, [initialType, isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function validateDraft() {
    const nextErrors: Record<string, string> = {};

    if (!draft.firstName.trim()) nextErrors.firstName = "Indiquez le prénom du profil.";
    if (!draft.lastName.trim()) nextErrors.lastName = "Indiquez le nom du profil.";
    if (!draft.birthDate) nextErrors.birthDate = "Indiquez une date de naissance.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateDraft()) return;

    onSubmit({
      birthDate: draft.birthDate,
      department: draft.department,
      firstName: draft.firstName.trim(),
      isHolder: true,
      isPayer: false,
      lastName: draft.lastName.trim(),
      relationship: selectedType === "YOUNG" ? "CHILD" : "RELATIVE",
      schoolLevel: selectedType === "YOUNG" ? draft.schoolLevel : undefined,
      seniorRelationship: selectedType === "SENIOR" ? draft.seniorRelationship : undefined,
      type: selectedType,
    });
  }

  return (
    <div
      aria-labelledby="add-member-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-idfm-anthracite/50 p-0 sm:items-center sm:p-5"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-idfm-interaction">Compte Famille Navigo</p>
            <h2 id="add-member-title" className="mt-2 text-2xl font-bold text-idfm-anthracite">
              Ajouter un profil au foyer
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Ajoutez un enfant ou un proche senior. Le profil apparaîtra immédiatement dans votre foyer.
            </p>
          </div>
          <button
            aria-label="Fermer la fenêtre"
            className="rounded-full px-3 py-2 text-2xl leading-none text-idfm-interaction hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-idfm-focus"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {([
            ["YOUNG", "Enfant / jeune", "Imagine R, Junior, renouvellement scolaire"],
            ["SENIOR", "Retraité / senior", "Navigo Senior, Améthyste, accompagnement"],
          ] as const).map(([type, title, description]) => {
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-3 focus-visible:outline-idfm-focus ${
                  isSelected ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white hover:border-idfm-medium"
                }`}
                onClick={() => {
                  setSelectedType(type);
                  setErrors({});
                }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-idfm-anthracite">{title}</h3>
                  <Badge tone={isSelected ? "blue" : "green"}>{isSelected ? "Sélectionné" : "Actif"}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-medium">{description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-light bg-neutral-xlight p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              error={errors.firstName}
              label="Prénom"
              name="newMemberFirstName"
              onChange={(event) => updateDraft("firstName", event.target.value)}
              value={draft.firstName}
            />
            <Input
              error={errors.lastName}
              label="Nom"
              name="newMemberLastName"
              onChange={(event) => updateDraft("lastName", event.target.value)}
              value={draft.lastName}
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Input
              error={errors.birthDate}
              label="Date de naissance"
              name="newMemberBirthDate"
              onChange={(event) => updateDraft("birthDate", event.target.value)}
              type="date"
              value={draft.birthDate}
            />
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
              Département de résidence
              <select
                className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                onChange={(event) => updateDraft("department", event.target.value)}
                value={draft.department}
              >
                {Object.entries(departmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            {selectedType === "YOUNG" ? (
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
                Niveau scolaire
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                  onChange={(event) => updateDraft("schoolLevel", event.target.value)}
                  value={draft.schoolLevel}
                >
                  {Object.entries(schoolLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
                Lien avec le gestionnaire
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                  onChange={(event) => updateDraft("seniorRelationship", event.target.value)}
                  value={draft.seniorRelationship}
                >
                  {Object.entries(seniorRelationshipLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="mt-5">
            {selectedType === "YOUNG" ? (
              <InfoBox tone={draftAge !== null && draftAge < 16 ? "orange" : "blue"}>
                {draftAge !== null && draftAge < 16
                  ? "Ce profil est mineur : le gestionnaire du foyer restera responsable des démarches et paiements."
                  : "Nous préparerons les recommandations Imagine R ou Navigo Junior adaptées à ce profil."}
              </InfoBox>
            ) : (
              <InfoBox>
                Nous préparerons une vérification d’offre Navigo Senior ou Améthyste depuis le dashboard.
              </InfoBox>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">
            Annuler
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmit} type="button">
            {isSubmitting ? "Ajout en cours..." : "Ajouter au foyer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
