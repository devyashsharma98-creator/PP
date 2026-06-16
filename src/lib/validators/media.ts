import { z } from "zod";
import { mediaCategoryValues } from "@/db/schema/enums";

export const createMediaAssetSchema = z.object({
  filename: z.string().min(1, "Filename is required.").max(512).trim(),
  storageKey: z.string().min(1, "Storage key is required.").max(1024).trim(),
  mimeType: z.string().min(1, "MIME type is required.").max(128).trim(),
  sizeBytes: z.number().int().positive("Size must be positive."),
  bucket: z.string().max(128).optional().default("media"),
  category: z.enum(mediaCategoryValues).optional().default("other"),
  altText: z.string().optional(),
  altTextHi: z.string().optional(),
  tags: z.array(z.string().trim()).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;

export const updateMediaAssetSchema = z.object({
  altText: z.string().optional(),
  altTextHi: z.string().optional(),
  tags: z.array(z.string().trim()).optional(),
  category: z.enum(mediaCategoryValues).optional(),
});
export type UpdateMediaAssetInput = z.infer<typeof updateMediaAssetSchema>;

export const listMediaAssetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  category: z.enum(mediaCategoryValues).optional(),
  search: z.string().trim().optional(),
});
export type ListMediaAssetsQuery = z.infer<typeof listMediaAssetsQuerySchema>;
