type FormErrorProps = {
  id?: string;
  message?: string;
};

export function FormError({ id, message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div id={id} className="mt-3 rounded-md border border-status-danger bg-red-50 px-4 py-3 text-sm font-semibold text-status-danger" role="alert">
      {message}
    </div>
  );
}
