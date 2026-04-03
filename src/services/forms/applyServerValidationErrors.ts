export type FieldErrorSetter = (field: string, message: string) => void;

export function applyServerValidationErrors(
  errors: Record<string, string[]>,
  setFieldError: FieldErrorSetter
) {
  Object.entries(errors).forEach(([field, messages]) => {
    const firstMessage = messages[0];

    if (firstMessage) {
      setFieldError(field, firstMessage);
    }
  });
}
