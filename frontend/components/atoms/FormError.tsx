type FormErrorProps = {
  id?: string;
  message?: string;
};

export function FormError({ id, message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className="mt-2 text-sm font-medium text-status-danger" role="alert">
      {message}
    </p>
  );
}
