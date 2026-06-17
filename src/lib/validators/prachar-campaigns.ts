import { z } from "zod";

export const createPracharCampaignSchema = z.object({
  title: z
    .string({ required_error: "Campaign title is required." })
    .trim()
    .min(1, "Campaign title is required.")
    .max(200, "Campaign title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(10_000, "Campaign description must be 10000 characters or fewer.")
    .optional(),
  startsAt: z.string().datetime({ message: "Invalid campaign date." }),
  unitId: z.string().uuid("Invalid unit ID.").optional(),
  departmentId: z.string().uuid("Invalid department ID.").optional(),
  templateReference: z
    .string()
    .trim()
    .max(256, "Template reference must be 256 characters or fewer.")
    .optional(),
});

export const updatePracharCampaignSchema = createPracharCampaignSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one campaign field is required.",
  });

export type CreatePracharCampaignInput = z.infer<typeof createPracharCampaignSchema>;
export type UpdatePracharCampaignInput = z.infer<typeof updatePracharCampaignSchema>;
