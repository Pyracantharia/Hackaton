import type { ReactNode } from "react";

type InfoBoxProps = {
  children: ReactNode;
  tone?: "blue" | "green" | "orange";
};

const tones = {
  blue: "border-idfm-medium bg-idfm-light text-idfm-anthracite",
  green: "border-status-successLight bg-green-50 text-status-success",
  orange: "border-status-warning bg-orange-50 text-idfm-anthracite",
};

export function InfoBox({ children, tone = "blue" }: InfoBoxProps) {
  return <div className={`rounded-md border p-4 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}
