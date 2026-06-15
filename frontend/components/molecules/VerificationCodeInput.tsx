import { Input } from "../atoms/Input";

type VerificationCodeInputProps = {
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
};

export function VerificationCodeInput({ error, label, name, onChange, value }: VerificationCodeInputProps) {
  return (
    <Input
      error={error}
      inputMode="numeric"
      label={label}
      maxLength={6}
      name={name}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="000000"
      value={value}
    />
  );
}
