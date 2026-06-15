import type { InputHTMLAttributes } from "react";
import { FormError } from "./FormError";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label: string;
};

export function Input({ error, hint, id, label, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={`mt-2 min-h-12 w-full rounded-md border bg-white px-4 text-base text-idfm-anthracite outline-none transition placeholder:text-neutral-medium focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium ${
          error ? "border-status-danger" : "border-neutral-medium"
        } ${className}`}
        {...props}
      />
      {hint ? <p className="mt-2 text-sm text-neutral-medium">{hint}</p> : null}
      <FormError id={errorId} message={error} />
    </div>
  );
}
