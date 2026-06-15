import Image from "next/image";

type IconPlaceholderProps = {
  label: string;
  src?: string;
};

export function IconPlaceholder({ label, src }: IconPlaceholderProps) {
  if (src) {
    return <Image src={src} alt="" width={36} height={36} className="h-9 w-9" aria-hidden="true" />;
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 items-center justify-center rounded-md bg-idfm-medium text-sm font-bold text-idfm-focus"
    >
      {label.slice(0, 1)}
    </span>
  );
}
