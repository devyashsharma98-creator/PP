import { z } from "zod";

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  nameHi: z.string().max(256).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
