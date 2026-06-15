import { Input } from "../atoms/Input";
import { PasswordInput } from "../atoms/PasswordInput";
import { PasswordChecklist } from "../molecules/PasswordChecklist";
import type { ParentForm, RegisterErrors } from "../register/types";

type RegisterParentAccountStepProps = {
  data: ParentForm;
  errors: RegisterErrors;
  onChange: (field: keyof ParentForm, value: string) => void;
};

export function RegisterParentAccountStep({ data, errors, onChange }: RegisterParentAccountStepProps) {
  return (
    <div className="grid gap-5">
      <Input error={errors.firstName} label="Prénom" name="firstName" onChange={(event) => onChange("firstName", event.target.value)} value={data.firstName} />
      <Input error={errors.lastName} label="Nom" name="lastName" onChange={(event) => onChange("lastName", event.target.value)} value={data.lastName} />
      <Input error={errors.email} label="Adresse e-mail" name="email" onChange={(event) => onChange("email", event.target.value)} type="email" value={data.email} />
      <Input error={errors.phone} hint="Format conseillé : +33612345678" label="Téléphone portable" name="phone" onChange={(event) => onChange("phone", event.target.value)} type="tel" value={data.phone} />
      <PasswordInput error={errors.password} label="Mot de passe" name="password" onChange={(event) => onChange("password", event.target.value)} value={data.password} />
      <PasswordChecklist password={data.password} />
      <PasswordInput error={errors.confirmationPassword} label="Confirmer le mot de passe" name="confirmationPassword" onChange={(event) => onChange("confirmationPassword", event.target.value)} value={data.confirmationPassword} />
    </div>
  );
}
