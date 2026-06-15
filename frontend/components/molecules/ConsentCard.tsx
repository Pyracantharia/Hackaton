import { Checkbox } from "../atoms/Checkbox";

type ConsentCardProps = {
  checked: boolean;
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
  required?: boolean;
};

export function ConsentCard({ checked, description, disabled, id, label, onChange, required }: ConsentCardProps) {
  return (
    <div className="rounded-md border border-neutral-light bg-white p-4">
      <Checkbox
        checked={checked}
        disabled={disabled}
        id={id}
        label={
          <span>
            {label} {required ? <span className="text-status-danger">*</span> : null}
          </span>
        }
        description={description}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}
