import { z } from 'zod';

const change_password = z.object({
  old_password: z
    .string()
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(16, { error: 'Password must be at most 16 characters' }),
  new_password: z
    .string()
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(16, { error: 'Password must be at most 16 characters' }),
});

export const user_schema = {
  change_password,
};
