import { z } from "zod";

export const presignedUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required."),
  contentType: z.string().min(1, "Content type is required."),
  bucket: z.string().optional(),
});

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
