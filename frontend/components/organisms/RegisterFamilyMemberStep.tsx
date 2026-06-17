import { useMemo, useState } from "react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { InfoBox } from "../molecules/InfoBox";
import type { IdfDepartment, RegisterMemberType, SchoolLevel, SeniorRelationship } from "@/lib/api/types";
import type { RegisterErrors, RegisterMemberForm } from "../register/types";
import { departmentLabels, schoolLevelLabels, seniorRelationshipLabels } from "../register/types";

type DraftMember = {
  birthDate: string;
  department: IdfDepartment;
  firstName: string;
  lastName: string;
  schoolLevel: SchoolLevel;
  seniorRelationship: SeniorRelationship;
};

type RegisterFamilyMemberStepProps = {
  errors: RegisterErrors;
  members: RegisterMemberForm[];
  onChange: (members: RegisterMemberForm[]) => void;
};

const emptyDraft: DraftMember = {
  birthDate: "",
  department: "94",
  firstName: "",
  lastName: "",
  schoolLevel: "COLLEGE",
  seniorRelationship: "PARENT",
};

const profileCards: Array<{
  description: string;
  enabled: boolean;
  id: RegisterMemberType | "SPOUSE" | "STUDENT" | "CAREGIVER" | "DISCOUNT";
  title: string;
}> = [
  {
    id: "YOUNG",
    title: "Enfant / jeune",
    description: "Pour gérer un forfait Imagine R, Navigo Junior ou un renouvellement scolaire.",
    enabled: true,
  },
  {
    id: "SENIOR",
    title: "Retraité / senior",
    description: "Pour accompagner un proche vers une offre Navigo Senior ou Améthyste.",
    enabled: true,
  },
  {
    id: "SPOUSE",
    title: "Conjoint",
    description: "Pour gérer les titres d’un autre adulte du foyer.",
    enabled: false,
  },
  {
    id: "STUDENT",
    title: "Étudiant",
    description: "Pour suivre un forfait étudiant ou une situation de bourse.",
    enabled: false,
  },
  {
    id: "CAREGIVER",
    title: "Proche aidé",
    description: "Pour accompagner une personne dans ses démarches.",
    enabled: false,
  },
  {
    id: "DISCOUNT",
    title: "Bénéficiaire d’une réduction",
    description: "Pour vérifier une aide ou une tarification solidaire.",
    enabled: false,
  },
];

function getAge(birthDate: string) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const date = new Date(birthDate);
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) ? age : null;
}

function buildMemberId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `member-${Date.now()}`;
}

export function RegisterFamilyMemberStep({ errors, members, onChange }: RegisterFamilyMemberStepProps) {
  const safeMembers = members ?? [];
  const [selectedType, setSelectedType] = useState<RegisterMemberType>("YOUNG");
  const [draft, setDraft] = useState<DraftMember>(emptyDraft);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const draftAge = useMemo(() => getAge(draft.birthDate), [draft.birthDate]);

  function updateDraft(field: keyof DraftMember, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetDraft(nextType = selectedType) {
    setDraft(emptyDraft);
    setSelectedType(nextType);
    setEditingId(null);
    setDraftErrors({});
  }

  function validateDraft() {
    const nextErrors: Record<string, string> = {};

    if (!draft.firstName.trim()) nextErrors.firstName = "Indiquez le prénom du profil.";
    if (!draft.lastName.trim()) nextErrors.lastName = "Indiquez le nom du profil.";
    if (!draft.birthDate) nextErrors.birthDate = "Indiquez une date de naissance.";

    setDraftErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSaveMember() {
    if (!validateDraft()) {
      return;
    }

    const nextMember: RegisterMemberForm = {
      birthDate: draft.birthDate,
      department: draft.department,
      firstName: draft.firstName.trim(),
      id: editingId ?? buildMemberId(),
      isHolder: true,
      isPayer: false,
      lastName: draft.lastName.trim(),
      relationship: selectedType === "YOUNG" ? "CHILD" : "RELATIVE",
      schoolLevel: selectedType === "YOUNG" ? draft.schoolLevel : undefined,
      seniorRelationship: selectedType === "SENIOR" ? draft.seniorRelationship : undefined,
      type: selectedType,
    };

    onChange(editingId ? safeMembers.map((member) => (member.id === editingId ? nextMember : member)) : [...safeMembers, nextMember]);
    resetDraft();
  }

  function handleEdit(member: RegisterMemberForm) {
    setSelectedType(member.type);
    setDraft({
      birthDate: member.birthDate,
      department: member.department,
      firstName: member.firstName,
      lastName: member.lastName,
      schoolLevel: member.schoolLevel ?? "COLLEGE",
      seniorRelationship: member.seniorRelationship ?? "PARENT",
    });
    setEditingId(member.id);
    setDraftErrors({});
  }

  function handleDelete(memberId: string) {
    onChange(safeMembers.filter((member) => member.id !== memberId));
    if (editingId === memberId) {
      resetDraft();
    }
  }

  return (
    <div className="grid gap-6">
      <InfoBox>
        Ajoutez les personnes dont vous souhaitez gérer les titres de transport. Vous pourrez ajouter plusieurs enfants
        ou accompagner un proche senior.
      </InfoBox>

      <div>
        <h2 className="text-xl font-bold text-idfm-anthracite">Qui souhaitez-vous ajouter à votre foyer ?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profileCards.map((card) => {
            const isSelected = selectedType === card.id;

            return (
              <button
                key={card.id}
                type="button"
                disabled={!card.enabled}
                onClick={() => {
                  if (card.enabled) {
                    resetDraft(card.id as RegisterMemberType);
                  }
                }}
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus disabled:cursor-not-allowed ${
                  isSelected
                    ? "border-idfm-interaction bg-idfm-light"
                    : "border-neutral-light bg-white hover:border-idfm-medium"
                } ${card.enabled ? "" : "opacity-75"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-idfm-anthracite">{card.title}</h3>
                  {card.enabled ? <Badge tone={isSelected ? "blue" : "green"}>{isSelected ? "Sélectionné" : "MVP"}</Badge> : <Badge tone="orange">Bientôt</Badge>}
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-medium">{card.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-idfm-anthracite">
              {editingId ? "Modifier ce profil" : selectedType === "YOUNG" ? "Ajouter un enfant / jeune" : "Ajouter un retraité / senior"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              {selectedType === "YOUNG"
                ? "Ces informations permettront de recommander le bon forfait et les justificatifs nécessaires."
                : "Nous vérifierons ensuite si une offre Navigo Senior ou Améthyste peut être adaptée à ce profil."}
            </p>
          </div>
          {editingId ? <Badge>Édition</Badge> : null}
        </div>

        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              error={draftErrors.firstName}
              label="Prénom"
              name="memberFirstName"
              onChange={(event) => updateDraft("firstName", event.target.value)}
              value={draft.firstName}
            />
            <Input
              error={draftErrors.lastName}
              label="Nom"
              name="memberLastName"
              onChange={(event) => updateDraft("lastName", event.target.value)}
              value={draft.lastName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              error={draftErrors.birthDate}
              label="Date de naissance"
              name="memberBirthDate"
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

          {selectedType === "YOUNG" && draftAge !== null && draftAge < 16 ? (
            <InfoBox tone="orange">
              Ce profil est mineur : le paiement devra être géré par un responsable légal.
            </InfoBox>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {editingId ? (
              <Button type="button" variant="ghost" onClick={() => resetDraft()}>
                Annuler la modification
              </Button>
            ) : null}
            <Button type="button" onClick={handleSaveMember}>
              {editingId ? "Enregistrer le profil" : "Ajouter ce profil"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-idfm-anthracite">Profils ajoutés à votre foyer</h2>
            <p className="mt-1 text-sm text-neutral-medium">Vous pouvez modifier ou supprimer un profil avant de continuer.</p>
          </div>
          <Badge tone={safeMembers.length ? "green" : "orange"}>{safeMembers.length} profil{safeMembers.length > 1 ? "s" : ""}</Badge>
        </div>

        {safeMembers.length ? (
          <div className="mt-5 grid gap-3">
            {safeMembers.map((member) => {
              const age = getAge(member.birthDate);
              const isYoung = member.type === "YOUNG";
              const detail = isYoung
                ? `${member.schoolLevel ? schoolLevelLabels[member.schoolLevel] : "Scolarité à préciser"} — ${departmentLabels[member.department]}`
                : `${departmentLabels[member.department]} — ${member.seniorRelationship ? seniorRelationshipLabels[member.seniorRelationship] : "Proche"}`;

              return (
                <article key={member.id} className="rounded-2xl border border-neutral-light bg-neutral-xlight p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-idfm-anthracite">{member.firstName} {member.lastName}</h3>
                      <p className="mt-1 text-sm text-neutral-medium">
                        {isYoung ? "Enfant / jeune" : "Retraité / senior"} · {age !== null ? `${age} ans` : member.birthDate}
                      </p>
                      <p className="mt-1 text-sm text-neutral-medium">{detail}</p>
                      <div className="mt-3">
                        <Badge tone={isYoung ? "blue" : "orange"}>{isYoung ? "Forfait à recommander" : "Offre Senior à vérifier"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => handleEdit(member)}>
                        Modifier
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => handleDelete(member.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <InfoBox tone="orange">Ajoutez au moins un profil pour créer votre espace famille.</InfoBox>
          </div>
        )}

        {errors.members ? <p className="mt-3 text-sm font-semibold text-status-danger">{errors.members}</p> : null}
      </section>
    </div>
  );
}
