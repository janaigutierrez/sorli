import "server-only";
import { z } from "zod";

/**
 * Variables només de servidor. El `import "server-only"` fa petar el build
 * si algun component de client importa aquest fitxer per error.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
});
