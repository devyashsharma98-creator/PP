import { notFound } from "next/navigation";

import { IconLabClient } from "./IconLabClient";

/**
 * /icon-lab — review-only surface for the custom hero icons (Phase 2A/2B).
 * Production-guarded: returns 404 in production builds so it is never exposed
 * to end users, while remaining available during local development. Not linked
 * from navigation.
 */
export default function IconLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <IconLabClient />;
}
