# Prachar Derived Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create and edit controls for Prachar campaigns while keeping each campaign as a published event plus `prachar_statuses`.

**Architecture:** Add Prachar-specific validation, server service functions, and API routes that create/update published events without a new table. Extend the Prachar hook and page so authorized users can create/edit campaigns while existing platform status tracking remains unchanged.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Drizzle ORM, Neon Serverless Postgres, TanStack Query, shadcn UI, Tailwind CSS.

---

## File Structure

- Create: `src/lib/validators/prachar-campaigns.ts`
  - Owns create/update input schemas and exported TypeScript types.
- Create: `src/lib/validators/prachar-campaigns.test.ts`
  - Locks required title/date validation and empty patch rejection.
- Modify: `src/lib/server/services/prachar-service.ts`
  - Adds campaign creation/update functions while preserving `updatePracharPlatform`.
- Create: `src/lib/server/services/prachar-service.test.ts`
  - Unit tests service behavior with mocked database/audit dependencies.
- Create: `src/app/api/v1/prachar/campaigns/route.ts`
  - Handles `POST /api/v1/prachar/campaigns`.
- Create: `src/app/api/v1/prachar/campaigns/[eventId]/route.ts`
  - Handles `PATCH /api/v1/prachar/campaigns/[eventId]`.
- Modify: `src/hooks/api/use-prachar.ts`
  - Adds create/update campaign mutations and exported input types.
- Modify: `src/components/pages/Prachar.tsx`
  - Adds create/edit dialogs and wires mutations into the existing campaign queue.
- Create: `src/components/pages/Prachar.test.tsx`
  - Focused jsdom assertions for create/edit control visibility.

## Task 1: Add Prachar Campaign Validation

**Files:**
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/lib/validators/prachar-campaigns.ts`
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/lib/validators/prachar-campaigns.test.ts`

- [ ] **Step 1: Write the failing validation tests**

Create `src/lib/validators/prachar-campaigns.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createPracharCampaignSchema,
  updatePracharCampaignSchema,
} from "./prachar-campaigns";

describe("prachar campaign validators", () => {
  it("requires title and startsAt when creating a campaign", () => {
    const result = createPracharCampaignSchema.safeParse({
      description: "A short outreach push",
      startsAt: "2026-06-17T09:00:00.000Z",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Campaign title is required.");
    }
  });

  it("rejects invalid campaign datetime values", () => {
    const result = createPracharCampaignSchema.safeParse({
      title: "Campus outreach",
      startsAt: "17 June 2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Invalid campaign date.");
    }
  });

  it("rejects an empty update payload", () => {
    const result = updatePracharCampaignSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("At least one campaign field is required.");
    }
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm run test -- src/lib/validators/prachar-campaigns.test.ts
```

Expected: FAIL because `src/lib/validators/prachar-campaigns.ts` does not exist.

- [ ] **Step 3: Add the validator implementation**

Create `src/lib/validators/prachar-campaigns.ts`:

```ts
import { z } from "zod";

export const createPracharCampaignSchema = z.object({
  title: z.string().trim().min(1, "Campaign title is required.").max(200, "Campaign title must be 200 characters or fewer."),
  description: z.string().trim().max(10_000, "Campaign description must be 10000 characters or fewer.").optional(),
  startsAt: z.string().datetime({ message: "Invalid campaign date." }),
  unitId: z.string().uuid("Invalid unit ID.").optional(),
  departmentId: z.string().uuid("Invalid department ID.").optional(),
  templateReference: z.string().trim().max(256, "Template reference must be 256 characters or fewer.").optional(),
});

export const updatePracharCampaignSchema = createPracharCampaignSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one campaign field is required.",
  });

export type CreatePracharCampaignInput = z.infer<typeof createPracharCampaignSchema>;
export type UpdatePracharCampaignInput = z.infer<typeof updatePracharCampaignSchema>;
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run:

```bash
npm run test -- src/lib/validators/prachar-campaigns.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/prachar-campaigns.ts src/lib/validators/prachar-campaigns.test.ts
git commit -m "test: add prachar campaign validation"
```

## Task 2: Add Campaign Service Functions

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/lib/server/services/prachar-service.ts`
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/lib/server/services/prachar-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `src/lib/server/services/prachar-service.test.ts` with database and audit mocks:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/lib/middleware/with-auth";
import {
  createPracharCampaign,
  updatePracharCampaign,
} from "./prachar-service";

const insertReturning = vi.fn();
const insertValues = vi.fn(() => ({ returning: insertReturning }));
const updateReturning = vi.fn();
const updateWhere = vi.fn(() => ({ returning: updateReturning }));
const updateSet = vi.fn(() => ({ where: updateWhere }));

vi.mock("@/db/client", () => ({
  db: {
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    query: {
      events: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/db/schema/index", () => ({
  events: {
    id: "events.id",
    title: "events.title",
    status: "events.status",
    startsAt: "events.startsAt",
    updatedAt: "events.updatedAt",
    createdAt: "events.createdAt",
  },
  eventStatusHistory: {},
  pracharStatuses: {},
}));

vi.mock("@/lib/audit", () => ({
  auditAndActivity: vi.fn(),
}));

const ctx = {
  session: {
    orgId: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    email: "aayam@example.org",
    displayName: "Aayam User",
  },
  permissions: { canUpdatePrachar: true },
} as unknown as AuthContext;

describe("prachar campaign service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a campaign as a published event", async () => {
    insertReturning.mockResolvedValueOnce([
      {
        id: "00000000-0000-0000-0000-000000000003",
        title: "Campus outreach",
        status: "published",
        startsAt: new Date("2026-06-17T09:00:00.000Z"),
        createdAt: new Date("2026-06-17T08:00:00.000Z"),
      },
    ]);

    const result = await createPracharCampaign(
      {
        title: "Campus outreach",
        description: "Launch campaign",
        startsAt: "2026-06-17T09:00:00.000Z",
        templateReference: "Poster A",
      },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("published");
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }));
  });

  it("rejects updates for non-published events", async () => {
    const { db } = await import("@/db/client");
    vi.mocked(db.query.events.findFirst).mockResolvedValueOnce({
      id: "00000000-0000-0000-0000-000000000003",
      status: "draft",
      title: "Draft event",
    } as never);

    const result = await updatePracharCampaign(
      "00000000-0000-0000-0000-000000000003",
      { title: "Updated title" },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm run test -- src/lib/server/services/prachar-service.test.ts
```

Expected: FAIL because `createPracharCampaign` and `updatePracharCampaign` are not exported.

- [ ] **Step 3: Implement service helpers**

Modify `src/lib/server/services/prachar-service.ts`:

```ts
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { events, eventStatusHistory, pracharStatuses } from "@/db/schema/index";
import { notFound, serverError } from "@/lib/response";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type {
  CreatePracharCampaignInput,
  UpdatePracharCampaignInput,
} from "@/lib/validators/prachar-campaigns";
```

Add these local result helpers near the top of the file:

```ts
type ServiceResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

function err(response: NextResponse): ServiceResult<never> {
  return { ok: false, response };
}

const PRACHAR_PLATFORMS = ["whatsapp", "facebook", "instagram", "telegram"] as const;
```

Add this helper:

```ts
async function writeTemplateReferenceRows(
  eventId: string,
  orgId: string,
  actorUserId: string,
  templateReference: string | undefined,
) {
  if (templateReference === undefined) return;

  for (const platform of PRACHAR_PLATFORMS) {
    await db
      .insert(pracharStatuses)
      .values({
        orgId,
        entityType: "event",
        entityId: eventId,
        platform,
        isDone: false,
        templateRef: templateReference || null,
        doneBy: actorUserId,
      })
      .onConflictDoNothing();
  }
}
```

Add this create function:

```ts
export async function createPracharCampaign(
  input: CreatePracharCampaignInput,
  ctx: AuthContext,
  ip: string,
): Promise<ServiceResult<{ id: string; title: string; status: string; startsAt: Date | null; createdAt: Date }>> {
  const actorName = ctx.session.displayName ?? ctx.session.email;
  const [newEvent] = await db
    .insert(events)
    .values({
      orgId: ctx.session.orgId,
      unitId: input.unitId ?? ctx.session.unitId ?? null,
      departmentId: input.departmentId ?? ctx.session.departmentId ?? null,
      title: input.title,
      description: input.description ?? null,
      startsAt: new Date(input.startsAt),
      status: "published",
      submittedByNameSnapshot: actorName,
      checklist: {},
      createdBy: ctx.session.userId,
      updatedBy: ctx.session.userId,
    })
    .returning({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      createdAt: events.createdAt,
    });

  if (!newEvent) return err(serverError("Failed to create Prachar campaign."));

  await db.insert(eventStatusHistory).values({
    eventId: newEvent.id,
    fromStatus: null,
    toStatus: "published",
    actorUserId: ctx.session.userId,
    actorNameSnapshot: actorName,
    notes: "Prachar campaign created directly from outreach desk.",
  });

  await writeTemplateReferenceRows(newEvent.id, ctx.session.orgId, ctx.session.userId, input.templateReference);

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "prachar.campaign_created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: newEvent.id,
      payload: input as Record<string, unknown>,
      changeSummary: `Prachar campaign created: "${newEvent.title}".`,
    },
    {
      summary: `${actorName} created Prachar campaign: "${newEvent.title}".`,
      actorNameSnapshot: actorName,
    },
  );

  return ok(newEvent);
}
```

Add this update function:

```ts
export async function updatePracharCampaign(
  eventId: string,
  input: UpdatePracharCampaignInput,
  ctx: AuthContext,
  ip: string,
): Promise<ServiceResult<{ id: string; title: string; status: string; startsAt: Date | null; updatedAt: Date }>> {
  const existing = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true, status: true },
  });

  if (!existing || existing.status !== "published") {
    return err(notFound("Prachar campaign not found."));
  }

  const [updated] = await db
    .update(events)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.startsAt !== undefined && { startsAt: new Date(input.startsAt) }),
      ...(input.unitId !== undefined && { unitId: input.unitId || null }),
      ...(input.departmentId !== undefined && { departmentId: input.departmentId || null }),
      updatedBy: ctx.session.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)))
    .returning({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      updatedAt: events.updatedAt,
    });

  if (!updated) return err(serverError("Failed to update Prachar campaign."));

  await writeTemplateReferenceRows(eventId, ctx.session.orgId, ctx.session.userId, input.templateReference);

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "prachar.campaign_updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: input as Record<string, unknown>,
      changeSummary: `Prachar campaign updated: "${updated.title}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated Prachar campaign: "${updated.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    },
  );

  return ok(updated);
}
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run:

```bash
npm run test -- src/lib/server/services/prachar-service.test.ts
```

Expected: PASS. If it fails because the mocked Drizzle chain does not match the implemented chain, change only the mock chain in `prachar-service.test.ts`, rerun this command, and continue only after it passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/services/prachar-service.ts src/lib/server/services/prachar-service.test.ts
git commit -m "feat: add prachar campaign service"
```

## Task 3: Add Campaign API Routes

**Files:**
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/api/v1/prachar/campaigns/route.ts`
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/api/v1/prachar/campaigns/[eventId]/route.ts`

- [ ] **Step 1: Write route behavior as service-backed tests**

Do not unit-test `withPermission` internals here; it is already shared middleware. Extend `src/lib/server/services/prachar-service.test.ts` with one assertion that service functions return `NextResponse` failures for non-published updates. The route layer remains thin and permission-protected by `withPermission("canUpdatePrachar")`.

Add this test:

```ts
it("returns not found when updating a campaign outside the published queue", async () => {
  const { db } = await import("@/db/client");
  vi.mocked(db.query.events.findFirst).mockResolvedValueOnce(null as never);

  const result = await updatePracharCampaign(
    "00000000-0000-0000-0000-000000000099",
    { title: "No campaign" },
    ctx,
    "127.0.0.1",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.response.status).toBe(404);
});
```

- [ ] **Step 2: Run the test and verify RED/GREEN boundary**

Run:

```bash
npm run test -- src/lib/server/services/prachar-service.test.ts
```

Expected: PASS if Task 2 implemented the published-event guard correctly; FAIL if the guard is missing.

- [ ] **Step 3: Add the POST route**

Create `src/app/api/v1/prachar/campaigns/route.ts`:

```ts
import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiCreated, badRequest } from "@/lib/response";
import { createPracharCampaignSchema } from "@/lib/validators/prachar-campaigns";
import { createPracharCampaign } from "@/lib/server/services/prachar-service";

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
```

- [ ] **Step 4: Add the PATCH route**

Create `src/app/api/v1/prachar/campaigns/[eventId]/route.ts`:

```ts
import "server-only";

import { NextRequest } from "next/server";

import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest } from "@/lib/response";
import { updatePracharCampaignSchema } from "@/lib/validators/prachar-campaigns";
import { updatePracharCampaign } from "@/lib/server/services/prachar-service";

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
```

- [ ] **Step 5: Run typecheck on the new routes**

Run:

```bash
npm run typecheck
```

Expected: PASS, or fail only on route/service type mismatches that must be fixed before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/prachar/campaigns/route.ts src/app/api/v1/prachar/campaigns/[eventId]/route.ts src/lib/server/services/prachar-service.test.ts
git commit -m "feat: add prachar campaign api"
```

## Task 4: Add Prachar Hook Mutations

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/hooks/api/use-prachar.ts`

- [ ] **Step 1: Write the hook contract before editing UI**

Add exported types and mutation hooks to `src/hooks/api/use-prachar.ts`:

```ts
export interface PracharCampaignInput {
  title: string;
  description?: string;
  startsAt: string;
  unitId?: string;
  departmentId?: string;
  templateReference?: string;
}

export type UpdatePracharCampaignInput = Partial<PracharCampaignInput>;
```

Then add:

```ts
export function useCreatePracharCampaign() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: async (input: PracharCampaignInput) => {
      const res = await fetch("/api/v1/prachar/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to create Prachar campaign");
      return data.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });
      queryClient.invalidateQueries({ queryKey: ["prachar-statuses"] });
      await refreshWorkspace();
    },
  });
}

export function useUpdatePracharCampaign() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: async ({ eventId, input }: { eventId: string; input: UpdatePracharCampaignInput }) => {
      const res = await fetch(`/api/v1/prachar/campaigns/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to update Prachar campaign");
      return data.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });
      queryClient.invalidateQueries({ queryKey: ["prachar-statuses"] });
      await refreshWorkspace();
    },
  });
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/api/use-prachar.ts
git commit -m "feat: add prachar campaign hooks"
```

## Task 5: Add Prachar Create/Edit UI

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Prachar.tsx`
- Create: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Prachar.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `src/components/pages/Prachar.test.tsx`:

```tsx
// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import Prachar from "./Prachar";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), { on: vi.fn(), off: vi.fn(), selectedScrollSnap: () => 0, scrollPrev: vi.fn(), scrollNext: vi.fn(), scrollTo: vi.fn() }],
}));

vi.mock("@/lib/useT", () => ({
  useT: () => (en: string) => en,
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    role: "aayam_pramukh",
    permissions: { canUpdatePrachar: true },
  }),
}));

vi.mock("@/hooks/api/use-dashboard", () => ({
  useDashboardEvents: () => ({
    data: [{
      id: "event-1",
      title: "Published Campaign",
      description: "Outreach description",
      date: "17 Jun 2026",
      dateIso: "2026-06-17T09:00:00.000Z",
      unit: "Delhi",
      status: "Published",
    }],
  }),
}));

vi.mock("@/hooks/api/use-org-structure", () => ({
  useOrgStructure: () => ({
    data: {
      units: [{ id: "unit-1", name: "Delhi", nameHi: null, code: "delhi", unitKind: "unit" }],
      departments: [{ id: "dept-1", name: "Prachar", nameHi: null, code: "prachar", departmentKind: "prachar", unitId: null }],
    },
  }),
}));

vi.mock("@/hooks/api/use-prachar", () => ({
  usePracharStatuses: () => ({ data: [] }),
  useUpdatePracharPlatform: () => ({ mutateAsync: vi.fn() }),
  useCreatePracharCampaign: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
  useUpdatePracharCampaign: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
}));

describe("Prachar campaign controls", () => {
  it("shows create and edit campaign controls for Prachar writers", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Prachar />);
    });

    expect(host.textContent).toContain("Create Campaign");
    expect(host.textContent).toContain("Edit Campaign");
  });
});
```

- [ ] **Step 2: Run the UI test and verify RED**

Run:

```bash
npm run test -- src/components/pages/Prachar.test.tsx
```

Expected: FAIL because Prachar does not yet render create/edit controls.

- [ ] **Step 3: Add imports to Prachar**

Modify `src/components/pages/Prachar.tsx` imports:

```ts
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrgStructure } from "@/hooks/api/use-org-structure";
import {
  useCreatePracharCampaign,
  usePracharStatuses,
  useUpdatePracharCampaign,
  useUpdatePracharPlatform,
  type PracharCampaignInput,
} from "@/hooks/api/use-prachar";
```

- [ ] **Step 4: Add dialog state and mutation wiring**

Inside `Prachar()`, add:

```ts
const { data: orgStructure } = useOrgStructure();
const createCampaignMutation = useCreatePracharCampaign();
const updateCampaignMutation = useUpdatePracharCampaign();
const [createOpen, setCreateOpen] = useState(false);
const [editingEventId, setEditingEventId] = useState<string | null>(null);
const [campaignForm, setCampaignForm] = useState<PracharCampaignInput>({
  title: "",
  description: "",
  startsAt: new Date().toISOString(),
  unitId: undefined,
  departmentId: undefined,
  templateReference: "",
});

const canManageCampaigns = permissions.canUpdatePrachar;
const editingEvent = publishedEvents.find((event) => event.id === editingEventId) ?? null;

const resetCampaignForm = () => {
  setCampaignForm({
    title: "",
    description: "",
    startsAt: new Date().toISOString(),
    unitId: undefined,
    departmentId: undefined,
    templateReference: "",
  });
};

const openEditCampaign = (event: typeof publishedEvents[number]) => {
  const status = getStatus(event.id);
  setEditingEventId(event.id);
  setCampaignForm({
    title: event.title,
    description: event.description,
    startsAt: event.dateIso || new Date().toISOString(),
    templateReference: status.templateReference ?? "",
  });
};

const submitCreateCampaign = async () => {
  await createCampaignMutation.mutateAsync(campaignForm);
  setCreateOpen(false);
  resetCampaignForm();
};

const submitEditCampaign = async () => {
  if (!editingEventId) return;
  await updateCampaignMutation.mutateAsync({ eventId: editingEventId, input: campaignForm });
  setEditingEventId(null);
  resetCampaignForm();
};
```

- [ ] **Step 5: Add a reusable campaign form block**

Add a local component above `export default function Prachar()`:

```tsx
function CampaignFields({
  t,
  value,
  units,
  departments,
  onChange,
}: {
  t: (en: string, hi: string) => string;
  value: PracharCampaignInput;
  units: Array<{ id: string; name: string; nameHi: string | null }>;
  departments: Array<{ id: string; name: string; nameHi: string | null }>;
  onChange: (next: PracharCampaignInput) => void;
}) {
  const setField = <K extends keyof PracharCampaignInput>(key: K, fieldValue: PracharCampaignInput[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>{t("Campaign title", "Abhiyan shirshak")}</Label>
        <Input value={value.title} onChange={(event) => setField("title", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("Campaign note", "Abhiyan tippani")}</Label>
        <Textarea value={value.description ?? ""} onChange={(event) => setField("description", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("Campaign date", "Abhiyan dinank")}</Label>
          <Input
            type="datetime-local"
            value={value.startsAt.slice(0, 16)}
            onChange={(event) => setField("startsAt", new Date(event.target.value).toISOString())}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("Template reference", "Template sandarbh")}</Label>
          <Input value={value.templateReference ?? ""} onChange={(event) => setField("templateReference", event.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("Unit", "Ikai")}</Label>
          <Select value={value.unitId ?? "none"} onValueChange={(next) => setField("unitId", next === "none" ? undefined : next)}>
            <SelectTrigger><SelectValue placeholder={t("Select unit", "Ikai chunen")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("No unit", "Koi ikai nahi")}</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>{t(unit.name, unit.nameHi ?? unit.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("Aayam", "Aayam")}</Label>
          <Select value={value.departmentId ?? "none"} onValueChange={(next) => setField("departmentId", next === "none" ? undefined : next)}>
            <SelectTrigger><SelectValue placeholder={t("Select aayam", "Aayam chunen")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("No aayam", "Koi aayam nahi")}</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>{t(department.name, department.nameHi ?? department.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add create dialog to the masthead area**

Near the top-right action area of the Prachar page, add:

```tsx
{canManageCampaigns && (
  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogTrigger asChild>
      <Button className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        {t("Create Campaign", "Abhiyan banayen")}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("Create Campaign", "Abhiyan banayen")}</DialogTitle>
        <DialogDescription>
          {t("Create a published outreach campaign directly from Prachar.", "Prachar se seedhe prakashit abhiyan banayen.")}
        </DialogDescription>
      </DialogHeader>
      <CampaignFields
        t={t}
        value={campaignForm}
        units={orgStructure?.units ?? []}
        departments={orgStructure?.departments ?? []}
        onChange={setCampaignForm}
      />
      {createCampaignMutation.error && (
        <p className="text-sm text-destructive">{createCampaignMutation.error.message}</p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("Cancel", "Radd")}</Button>
        <Button onClick={submitCreateCampaign} disabled={createCampaignMutation.isPending}>
          {createCampaignMutation.isPending ? t("Creating...", "Ban raha hai...") : t("Create Campaign", "Abhiyan banayen")}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

- [ ] **Step 7: Add edit action and dialog**

Inside each campaign dossier card action area, add:

```tsx
{canManageCampaigns && (
  <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto" onClick={() => openEditCampaign(event)}>
    <Pencil className="mr-1 h-3 w-3" />
    {t("Edit Campaign", "Abhiyan sampadit karen")}
  </Button>
)}
```

Near the end of the component, add:

```tsx
<Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEventId(null); }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t("Edit Campaign", "Abhiyan sampadit karen")}</DialogTitle>
      <DialogDescription>
        {t("Update the published event details used by this Prachar campaign.", "Is Prachar abhiyan ke prakashit karyakram vivaran update karen.")}
      </DialogDescription>
    </DialogHeader>
    <CampaignFields
      t={t}
      value={campaignForm}
      units={orgStructure?.units ?? []}
      departments={orgStructure?.departments ?? []}
      onChange={setCampaignForm}
    />
    {updateCampaignMutation.error && (
      <p className="text-sm text-destructive">{updateCampaignMutation.error.message}</p>
    )}
    <DialogFooter>
      <Button variant="outline" onClick={() => setEditingEventId(null)}>{t("Cancel", "Radd")}</Button>
      <Button onClick={submitEditCampaign} disabled={updateCampaignMutation.isPending}>
        {updateCampaignMutation.isPending ? t("Saving...", "Saheja ja raha hai...") : t("Save Campaign", "Abhiyan sahejen")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 8: Run the UI test and typecheck**

Run:

```bash
npm run test -- src/components/pages/Prachar.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/pages/Prachar.tsx src/components/pages/Prachar.test.tsx
git commit -m "feat: add prachar campaign dialogs"
```

## Task 6: Final Verification

**Files:**
- Verify only; no planned file edits.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/lib/validators/prachar-campaigns.test.ts src/lib/server/services/prachar-service.test.ts src/components/pages/Prachar.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: clean working tree after all task commits.

## Self-Review Notes

- Spec coverage: campaign creation, edit, no new table, `canUpdatePrachar`, template reference rows, hooks, UI, and tests are all mapped to tasks.
- Scope: this plan does not add public posting integrations, generated assets, new workflow statuses, uploads, or schema migrations.
- Type consistency: client uses `startsAt`, `unitId`, `departmentId`, and `templateReference`; server validators and hooks use the same camelCase names.
