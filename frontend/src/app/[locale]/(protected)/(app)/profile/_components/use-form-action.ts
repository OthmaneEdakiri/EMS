import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "../types";
import { HTTP_STATUS } from "../types";

interface UseFormActionOptions {
  onSuccess?: (result: ActionResult) => void;
  onValidationError?: (result: ActionResult) => void;
  onServerError?: (result: ActionResult) => void;
}

export function useFormAction<T extends Record<string, string>>(
  action: (values: T) => Promise<ActionResult | undefined>,
  options: UseFormActionOptions = {},
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: T) => {
      setLoading(true);
      setError(null);
      try {
        const result = await action(values);

        if (!result) {
          setError("An error occurred");
          return;
        }

        if (result.status === HTTP_STATUS.OK) {
          options.onSuccess?.(result);
        } else if (result.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          options.onValidationError?.(result);
          if (result.errors) {
            Object.values(result.errors).forEach((fieldErrors) => {
              toast.error(fieldErrors[0]);
            });
          }
        } else {
          const message = result.message || "An error occurred";
          setError(message);
          options.onServerError?.(result);
        }
      } finally {
        setLoading(false);
      }
    },
    [action, options],
  );

  return { submit, loading, error };
}
