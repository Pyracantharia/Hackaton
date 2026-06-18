import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "blue" | "green" | "orange" | "red";
};

const tones = {
  blue: "bg-blue-50 text-idfm-focus",
  green: "bg-green-50 text-status-success",
  orange: "bg-orange-50 text-status-warning",
  red: "bg-red-50 text-status-danger",
};

function toSentenceCase(value: string) {
  const normalized = value.trim().toLocaleLowerCase("fr-FR");
  return normalized ? normalized.charAt(0).toLocaleUpperCase("fr-FR") + normalized.slice(1) : normalized;
}

function formatBadgeContent(children: ReactNode): ReactNode {
  if (typeof children === "string" || typeof children === "number") {
    return toSentenceCase(String(children));
  }

  if (Array.isArray(children)) {
    return children.map((child) => formatBadgeContent(child));
  }

  return children;
}

export function Badge({ children, tone = "blue" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold normal-case ${tones[tone]}`}>
      {formatBadgeContent(children)}
    </span>
  );
}
