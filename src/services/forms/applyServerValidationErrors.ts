export type FieldErrorSetter = (field: string, message: string) => void;

export function applyServerValidationErrors(
  errors: Record<string, string[]>,
  setFieldError: FieldErrorSetter
) {
  Object.entries(errors).forEach(([field, messages]) => {
    const firstMessage = messages[0];
    const normalizedField = field.length > 0
      ? `${field.charAt(0).toLowerCase()}${field.slice(1)}`
      : field;

    if (firstMessage) {
      setFieldError(normalizedField, firstMessage);
    }
  });
}
