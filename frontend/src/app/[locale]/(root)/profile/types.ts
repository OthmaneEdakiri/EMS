export const HTTP_STATUS = {
  OK: 200,
  UNPROCESSABLE_ENTITY: 422,
} as const;

export interface ActionResult {
  status: number;
  message: string;
  data?: Record<string, unknown>;
  errors?: Record<string, string[]>;
}

export type FieldValidator = (
  value: unknown,
  formValues?: Record<string, string>,
) => string | null;

export function createNameValidator(
  requiredMsg: string,
  minLengthMsg: string,
  minLength = 2,
): FieldValidator {
  return (value) => {
    if (typeof value !== "string" || value.length === 0) return requiredMsg;
    if (value.length < minLength) return minLengthMsg;
    return null;
  };
}

export function createRequiredValidator(requiredMsg: string): FieldValidator {
  return (value) => {
    if (typeof value !== "string" || value.length === 0) return requiredMsg;
    return null;
  };
}

export function createMinLengthValidator(
  requiredMsg: string,
  minLengthMsg: string,
  minLength = 8,
): FieldValidator {
  return (value) => {
    if (typeof value !== "string" || value.length === 0) return requiredMsg;
    if (value.length < minLength) return minLengthMsg;
    return null;
  };
}

export function createMatchValidator(
  requiredMsg: string,
  mismatchMsg: string,
  fieldName: string,
): FieldValidator {
  return (value, formValues) => {
    if (typeof value !== "string" || value.length === 0) return requiredMsg;
    if (formValues && value !== formValues[fieldName]) return mismatchMsg;
    return null;
  };
}
