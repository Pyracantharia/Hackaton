import Image from "next/image";
import { Badge } from "../atoms/Badge";
import type { DashboardMember } from "@/lib/api/types";
import { getProfileVisual } from "@/lib/member-visuals";

type ProfilePickerCardProps = {
  isSelected: boolean;
  member: DashboardMember;
  onSelect: () => void;
};

export function ProfilePickerCard({ isSelected, member, onSelect }: ProfilePickerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full flex-col rounded-2xl border p-5 text-left shadow-sm transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus ${
        isSelected ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white hover:border-idfm-medium"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
          <Image src={getProfileVisual(member.profileType)} alt="" width={48} height={48} className="h-11 w-11 object-contain" />
        </span>
        {isSelected ? <Badge tone="blue">Sélectionné</Badge> : null}
      </div>
      <h3 className="mt-4 text-lg font-bold text-idfm-anthracite">{member.firstName} {member.lastName}</h3>
      <p className="mt-1 text-sm text-neutral-medium">{member.relationLabel}</p>
      <p className="mt-3 text-sm leading-6 text-neutral-medium">{member.nextAction}</p>
    </button>
  );
}
