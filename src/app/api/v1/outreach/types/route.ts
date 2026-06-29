/**
 * GET /api/v1/outreach/types
 * Returns the outreach type configs (labels + dynamic field definitions).
 * Sourced from the static OUTREACH_TYPES config so the client never needs the
 * DB table directly; the table exists for future per-org customisation.
 */
import "server-only";
import { NextRequest } from "next/server";

import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { OUTREACH_TYPES } from "@/lib/app/outreach-types";

export const GET = withAuth(async (_req: NextRequest) => {
  const payload = Object.entries(OUTREACH_TYPES).map(([type, def]) => ({ type, ...def }));
  return apiSuccess(payload);
});
