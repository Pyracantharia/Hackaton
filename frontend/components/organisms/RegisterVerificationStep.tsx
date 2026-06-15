import { InfoBox } from "../molecules/InfoBox";
import { VerificationCodeInput } from "../molecules/VerificationCodeInput";
import type { RegisterErrors, VerificationForm } from "../register/types";

type RegisterVerificationStepProps = {
  data: VerificationForm;
  errors: RegisterErrors;
  onChange: (field: keyof VerificationForm, value: string) => void;
};

export function RegisterVerificationStep({ data, errors, onChange }: RegisterVerificationStepProps) {
  return (
    <div className="grid gap-5">
      <InfoBox>
        Pour la démo, les vérifications sont simulées dans le parcours : code SMS <strong>123456</strong>, code e-mail <strong>654321</strong>.
      </InfoBox>
      <VerificationCodeInput error={errors.smsCode} label="Code SMS" name="smsCode" onChange={(value) => onChange("smsCode", value)} value={data.smsCode} />
      <VerificationCodeInput error={errors.emailCode} label="Code e-mail" name="emailCode" onChange={(value) => onChange("emailCode", value)} value={data.emailCode} />
    </div>
  );
}
