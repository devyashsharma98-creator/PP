import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, serverError } from "@/lib/response";
import { sql } from "@/lib/neon/repository";
import type { PracharStatusRow } from "@/lib/neon/repository";

type PracharPlatform = "whatsapp" | "facebook" | "instagram" | "telegram";

type PracharStatusPayload = {
  eventId: string;
  platforms: Record<PracharPlatform, boolean>;
  skipReasons: Record<PracharPlatform, string | null>;
  templateReference: string | null;
};

const pracharPlatforms = new Set<PracharPlatform>(["whatsapp", "facebook", "instagram", "telegram"]);

export const GET = withAuth(async (req: NextRequest, ctx) => {
  try {
    const rawStatuses = await sql`
      SELECT entity_id, platform, is_done, skip_reason, template_ref 
      FROM public.prachar_statuses 
      WHERE entity_type = 'event'
    ` as unknown as PracharStatusRow[];

    // Group by entity_id to match the UI expectation
    const statusMap = new Map<string, PracharStatusPayload>();

    for (const status of rawStatuses) {
      const eventId = status.entity_id;
      if (!eventId) continue;

      if (!statusMap.has(eventId)) {
        statusMap.set(eventId, {
          eventId,
          platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false },
          skipReasons: { whatsapp: null, facebook: null, instagram: null, telegram: null },
          templateReference: null,
        });
      }

      const current = statusMap.get(eventId);
      if (!current) continue;
      const platformKey = status.platform as PracharPlatform;
      if (pracharPlatforms.has(platformKey)) {
        current.platforms[platformKey] = status.is_done ?? false;
        current.skipReasons[platformKey] = status.skip_reason ?? null;
      }
      current.templateReference = status.template_ref ?? current.templateReference;
    }

    return apiSuccess(Array.from(statusMap.values()));
  } catch (error) {
    console.error("Failed to fetch prachar statuses:", error);
    return serverError("Failed to fetch prachar statuses");
  }
});
