import { z } from 'zod';

type ValidationResult<T> =
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> };

export function validatePayload<T extends z.ZodTypeAny>(
  schema: T,
  payload: unknown
): ValidationResult<T> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.reduce(
      (acc, curr) => {
        const key = curr.path.join('.');
        acc[key] = curr.message;
        return acc;
      },
      {} as Record<string, string>
    );

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
