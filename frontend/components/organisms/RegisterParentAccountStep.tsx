import { Input } from "../atoms/Input";
import { PasswordInput } from "../atoms/PasswordInput";
import { PasswordChecklist } from "../molecules/PasswordChecklist";
import { GoogleAuthButton } from "../molecules/GoogleAuthButton";
import { InfoBox } from "../molecules/InfoBox";
import type { ParentForm, RegisterErrors } from "../register/types";

type RegisterParentAccountStepProps = {
  data: ParentForm;
  errors: RegisterErrors;
  onChange: (field: keyof ParentForm, value: string) => void;
  onGoogleCredential: (credential: string) => void;
  onGoogleError: (message: string) => void;
};

export function RegisterParentAccountStep({ data, errors, onChange, onGoogleCredential, onGoogleError }: RegisterParentAccountStepProps) {
  const isGoogleAccount = data.authProvider === "GOOGLE";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <GoogleAuthButton
          label="Continuer avec Google"
          onCredential={onGoogleCredential}
          onError={onGoogleError}
        />
        <InfoBox>
          Google nous permet uniquement de récupérer vos informations de compte de base. Les informations de votre foyer restent à compléter manuellement.
        </InfoBox>
      </div>

      <Input error={errors.firstName} label="Prénom" name="firstName" onChange={(event) => onChange("firstName", event.target.value)} value={data.firstName} />
      <Input error={errors.lastName} label="Nom" name="lastName" onChange={(event) => onChange("lastName", event.target.value)} value={data.lastName} />
      <Input
        error={errors.email}
        label="Adresse e-mail"
        name="email"
        onChange={(event) => onChange("email", event.target.value)}
        readOnly={isGoogleAccount}
        type="email"
        value={data.email}
        className={isGoogleAccount ? "bg-neutral-xlight" : ""}
      />
      <Input error={errors.phone} hint="Format conseillé : +33612345678" label="Téléphone portable" name="phone" onChange={(event) => onChange("phone", event.target.value)} type="tel" value={data.phone} />
      {isGoogleAccount ? (
        <InfoBox tone="green">
          Votre compte sera relié à Google. Aucun mot de passe local n&apos;est nécessaire pour cette inscription.
        </InfoBox>
      ) : (
        <>
          <PasswordInput error={errors.password} label="Mot de passe" name="password" onChange={(event) => onChange("password", event.target.value)} value={data.password} />
          <PasswordChecklist password={data.password} />
          <PasswordInput error={errors.confirmationPassword} label="Confirmer le mot de passe" name="confirmationPassword" onChange={(event) => onChange("confirmationPassword", event.target.value)} value={data.confirmationPassword} />
        </>
      )}
    </div>
  );
}
