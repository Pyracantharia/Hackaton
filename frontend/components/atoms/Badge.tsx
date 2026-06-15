import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "blue" | "green" | "orange";
};

const tones = {
  blue: "bg-idfm-medium text-idfm-focus",
  green: "bg-green-50 text-status-success",
  orange: "bg-orange-50 text-status-warning",
};

export function Badge({ children, tone = "blue" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-bold uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}
