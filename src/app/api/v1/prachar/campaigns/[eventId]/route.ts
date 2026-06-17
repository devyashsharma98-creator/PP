import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest } from "@/lib/response";
import { updatePracharCampaign } from "@/lib/server/services/prachar-service";
import { updatePracharCampaignSchema } from "@/lib/validators/prachar-campaigns";

type Params = { eventId: string };

export const PATCH = withPermission("canUpdatePrachar", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updatePracharCampaignSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await updatePracharCampaign(eventId, parsed.data, ctx, ip);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
