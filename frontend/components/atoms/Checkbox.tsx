import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  description?: string;
  label: ReactNode;
};

export function Checkbox({ description, id, label, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name;

  return (
    <label
      htmlFor={checkboxId}
      className="flex cursor-pointer gap-3 rounded-md border border-neutral-light bg-white p-4 transition focus-within:border-idfm-focus focus-within:ring-3 focus-within:ring-idfm-medium"
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-neutral-medium accent-idfm-interaction"
        {...props}
      />
      <span className="flex flex-col">
        <span className="font-semibold text-idfm-anthracite">{label}</span>
        {description ? <span className="mt-1 text-sm leading-6 text-neutral-medium">{description}</span> : null}
      </span>
    </label>
  );
}
