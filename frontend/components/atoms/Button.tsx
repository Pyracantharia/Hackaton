import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-idfm-interaction text-white hover:bg-idfm-focus",
  secondary: "border border-idfm-interaction bg-white text-idfm-interaction hover:bg-idfm-light",
  ghost: "bg-transparent text-idfm-interaction hover:bg-idfm-light",
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus disabled:cursor-not-allowed disabled:border-neutral-light disabled:bg-neutral-light disabled:text-neutral-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
