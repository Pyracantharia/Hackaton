import { Input } from "../atoms/Input";
import { Badge } from "../atoms/Badge";
import type { ChildForm, RegisterErrors } from "../register/types";
import { departmentLabels, schoolLevelLabels } from "../register/types";

type RegisterFamilyMemberStepProps = {
  data: ChildForm;
  errors: RegisterErrors;
  onChange: (field: keyof ChildForm, value: string) => void;
};

export function RegisterFamilyMemberStep({ data, errors, onChange }: RegisterFamilyMemberStepProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Moi-même", "Mon enfant", "Un proche"].map((label) => (
          <div
            key={label}
            className={`rounded-md border p-4 ${label === "Mon enfant" ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-idfm-anthracite">{label}</span>
              {label === "Mon enfant" ? <Badge>Actif</Badge> : <Badge tone="orange">Plus tard</Badge>}
            </div>
          </div>
        ))}
      </div>
      <Input error={errors.childFirstName} label="Prénom de l'enfant" name="childFirstName" onChange={(event) => onChange("firstName", event.target.value)} value={data.firstName} />
      <Input error={errors.childLastName} label="Nom de l'enfant" name="childLastName" onChange={(event) => onChange("lastName", event.target.value)} value={data.lastName} />
      <Input error={errors.birthDate} label="Date de naissance" name="birthDate" onChange={(event) => onChange("birthDate", event.target.value)} type="date" value={data.birthDate} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
          Niveau scolaire
          <select
            className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
            onChange={(event) => onChange("schoolLevel", event.target.value)}
            value={data.schoolLevel}
          >
            {Object.entries(schoolLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
          Département de résidence
          <select
            className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
            onChange={(event) => onChange("department", event.target.value)}
            value={data.department}
          >
            {Object.entries(departmentLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
