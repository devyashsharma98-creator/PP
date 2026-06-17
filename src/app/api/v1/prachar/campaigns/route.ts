import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiCreated, badRequest } from "@/lib/response";
import { createPracharCampaign } from "@/lib/server/services/prachar-service";
import { createPracharCampaignSchema } from "@/lib/validators/prachar-campaigns";

export const POST = withPermission("canUpdatePrachar", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = createPracharCampaignSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  const result = await createPracharCampaign(parsed.data, ctx, ip);
  if (!result.ok) return result.response;

  return apiCreated(result.data);
});
