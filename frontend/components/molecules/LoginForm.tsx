"use client";

import { Button } from "../atoms/Button";
import { FormError } from "../atoms/FormError";
import { Input } from "../atoms/Input";
import { PasswordInput } from "../atoms/PasswordInput";

type LoginFormProps = {
  email: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onHelp: () => void;
  onForgotPassword: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
  submitError?: string;
};

export function LoginForm({
  email,
  errors,
  isSubmitting,
  onEmailChange,
  onForgotPassword,
  onHelp,
  onPasswordChange,
  onSubmit,
  password,
  submitError,
}: LoginFormProps) {
  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input
        autoComplete="email"
        error={errors.email}
        label="Adresse e-mail"
        name="email"
        onChange={(event) => onEmailChange(event.target.value)}
        type="email"
        value={email}
      />
      <PasswordInput
        autoComplete="current-password"
        error={errors.password}
        label="Mot de passe"
        name="password"
        onChange={(event) => onPasswordChange(event.target.value)}
        value={password}
      />
      <div className="grid gap-3 text-sm">
        <button
          className="w-fit text-left font-semibold text-idfm-interaction underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-idfm-focus"
          type="button"
          onClick={onForgotPassword}
        >
          Mot de passe oublié
        </button>
        <button
          className="w-fit text-left font-semibold text-idfm-interaction underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-idfm-focus"
          type="button"
          onClick={onHelp}
        >
          Je n&apos;arrive pas à me connecter
        </button>
      </div>
      <FormError message={submitError} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Connexion en cours..." : "Connexion"}
      </Button>
    </form>
  );
}
