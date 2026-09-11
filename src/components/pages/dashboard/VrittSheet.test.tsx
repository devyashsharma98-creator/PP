// @vitest-environment jsdom
/**
 * The Vritt sheet, end to end in the browser runtime: the real sheet component,
 * the real useVrittEditor hook and the real request builder, talking to a fake
 * /vritt endpoint that applies the real authorization rules. Every assertion
 * about a payload is made on the exact JSON body the UI put on the wire.
 */
import { createRoot, type Root } from "react-dom/client";
import { act, createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { RoleCode } from "@/lib/permissions/index";
import {
  availableVrittActions,
  decideVrittTransition,
  vrittFieldPolicy,
  type VrittStatus,
} from "@/lib/app/vritt-access";

const toast = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock("@/lib/useT", () => ({
  useT: () => (en: string) => en,
  repairBrokenHindi: (s: string) => s,
}));
vi.mock("@/context/AppContext", () => ({ useAppContext: () => ({ refreshWorkspace: vi.fn() }) }));
vi.mock("@/components/ToastProvider", () => ({ useToast: () => toast }));

const { useVrittEditor } = await import("@/hooks/api/use-dashboard");
const { VrittSheetBody } = await import("./DashboardReviewOverlays");
const { Sheet, SheetContent } = await import("@/components/ui/sheet");

// ── Fake endpoint ────────────────────────────────────────────────────────────

const UNIT = "00000000-0000-0000-0000-0000000000a1";
const EVENT = { id: "00000000-0000-0000-0000-0000000000e1", unitId: UNIT, departmentId: null, createdBy: "someone-else" };

interface Stored {
  status: VrittStatus;
  content: string | null;
  attendanceCount: number | null;
  mediaUrls: string[];
  reviewNotes: string | null;
  version: number;
}

const server = {
  role: "unit_head" as RoleCode,
  stored: null as Stored | null,
  bodies: [] as Array<Record<string, unknown>>,
  /** Force the next POST to answer with this status. */
  forceStatus: null as number | null,
  forceMessage: "",
  offline: false,
};

function subject() {
  return {
    userId: "viewer",
    roleCodes: [server.role],
    scope: { orgWide: false, unitIds: new Set([UNIT]), departmentIds: new Set<string>(), eventIds: new Set<string>(), articleIds: new Set<string>() },
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function fakeFetch(_url: string, init?: RequestInit): Promise<Response> {
  if (server.offline) throw new TypeError("Failed to fetch");
  const current = server.stored?.status ?? null;

  if (!init?.method || init.method === "GET") {
    return json(200, {
      success: true,
      data: {
        vritt: server.stored && {
          status: server.stored.status,
          content: server.stored.content,
          contentHi: null,
          attendanceCount: server.stored.attendanceCount,
          mediaUrls: server.stored.mediaUrls,
          reviewNotes: server.stored.reviewNotes,
          updatedAt: `v${server.stored.version}`,
        },
        actions: availableVrittActions({ subject: subject(), event: EVENT, current, hasEditPermission: true }),
      },
    });
  }

  const body = JSON.parse(String(init.body)) as Record<string, unknown>;
  server.bodies.push(body);

  if (server.forceStatus) {
    const status = server.forceStatus;
    server.forceStatus = null;
    return json(status, { success: false, error: { code: "X", message: server.forceMessage } });
  }

  // Same order as the real route: staleness before the transition is judged.
  const next = body.status as VrittStatus;
  if ("expectedStatus" in body && body.expectedStatus !== current) {
    return json(409, { success: false, error: { code: "CONFLICT", message: "This vritt has changed since you opened it." } });
  }
  const decision = decideVrittTransition({ subject: subject(), event: EVENT, current, next, hasEditPermission: true });
  if (!decision.allowed) return json(403, { success: false, error: { code: "FORBIDDEN", message: decision.reason } });
  const policy = vrittFieldPolicy(current, next);
  const carriesContent = ["content", "contentHi", "attendanceCount", "mediaUrls"].some((k) => k in body);
  if (carriesContent && !policy.contentWritable) {
    return json(400, { success: false, error: { code: "BAD_REQUEST", message: "This transition cannot change the report's content." } });
  }

  const prev = server.stored;
  server.stored = {
    status: next,
    content: policy.contentWritable && "content" in body ? (body.content as string) : prev?.content ?? null,
    attendanceCount: policy.contentWritable && "attendanceCount" in body ? (body.attendanceCount as number) : prev?.attendanceCount ?? null,
    mediaUrls: policy.contentWritable && "mediaUrls" in body ? (body.mediaUrls as string[]) : prev?.mediaUrls ?? [],
    reviewNotes: policy.reviewNotesWritable && "reviewNotes" in body ? (body.reviewNotes as string) : prev?.reviewNotes ?? null,
    version: (prev?.version ?? 0) + 1,
  };
  return json(200, { success: true, data: {} });
}

// ── Harness ──────────────────────────────────────────────────────────────────

function Harness() {
  const editor = useVrittEditor({ id: EVENT.id });
  // Mounted inside the real Sheet, as the dashboard mounts it.
  return createElement(Sheet, { open: true }, createElement(SheetContent, { side: "right" }, createElement(VrittSheetBody, {
    event: { id: EVENT.id, title: "Yuva baithak", date: "01 Dec 2026" } as never,
    form: editor.form,
    setForm: editor.setForm,
    view: editor.view,
    reviewNotes: editor.reviewNotes,
    setReviewNotes: editor.setReviewNotes,
    isDirty: editor.isDirty,
    pendingAction: editor.pendingAction,
    actionError: editor.actionError,
    onAction: editor.runAction,
    onGenerateSmartDraft: () => {},
  })));
}

let container: HTMLDivElement;
let root: Root;

function withClient(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return createElement(QueryClientProvider, { client }, node);
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

async function mount() {
  await act(async () => { root.render(withClient(createElement(Harness))); });
  await flush();
}

const buttons = () => [...document.body.querySelectorAll("button")];
const button = (label: string) => buttons().find((b) => b.textContent?.trim().includes(label));
const buttonLabels = () => buttons().map((b) => b.textContent?.trim()).filter(Boolean);
const statusText = () => document.body.querySelector('[data-testid="vritt-status"]')?.textContent?.trim();
const textarea = () => document.body.querySelector<HTMLTextAreaElement>("#vritt-content")!;

async function click(label: string) {
  const el = button(label);
  if (!el) throw new Error(`No button "${label}". Have: ${buttonLabels().join(" | ")}`);
  await act(async () => { el.click(); });
  await flush();
}

/** Type into a React-controlled field the way a person does. */
async function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
  await act(async () => { el.dispatchEvent(new Event("input", { bubbles: true })); });
}

const CONTENT_KEYS = ["content", "contentHi", "attendanceCount", "mediaUrls"];

beforeEach(() => {
  Object.assign(server, { role: "unit_head", stored: null, bodies: [], forceStatus: null, forceMessage: "", offline: false });
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  toast.addToast.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

// ── Unit head ────────────────────────────────────────────────────────────────

describe("a unit head writing their unit's report", () => {
  it("can only save a draft before anything is saved", async () => {
    await mount();
    expect(statusText()).toBe("Not started");
    expect(button("Save draft")).toBeTruthy();
    expect(button("Submit for review")).toBeUndefined();
    expect(button("Mark reviewed")).toBeUndefined();
    expect(button("Reopen to draft")).toBeUndefined();
  });

  it("saves a draft with the content it typed", async () => {
    await mount();
    await type(textarea(), "Sixty attended the baithak.");
    await type(document.body.querySelector<HTMLInputElement>("#vritt-attendance")!, "60");
    await click("Save draft");

    expect(server.bodies).toEqual([
      { status: "draft", expectedStatus: null, content: "Sixty attended the baithak.", attendanceCount: 60, mediaUrls: [] },
    ]);
    expect(statusText()).toBe("Draft");
  });

  it("submits a saved draft with a status-only body", async () => {
    server.stored = { status: "draft", content: "Report.", attendanceCount: 40, mediaUrls: ["https://x/a.jpg"], reviewNotes: null, version: 1 };
    await mount();
    await click("Submit for review");

    expect(server.bodies).toEqual([{ status: "submitted", expectedStatus: "draft" }]);
    for (const key of CONTENT_KEYS) expect(server.bodies[0]).not.toHaveProperty(key);
    // The content the server held survived the submission.
    expect(server.stored).toMatchObject({ status: "submitted", content: "Report.", attendanceCount: 40, mediaUrls: ["https://x/a.jpg"] });
  });

  it("stops to ask about unsaved edits before submitting", async () => {
    server.stored = { status: "draft", content: "Old text.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    await type(textarea(), "New text.");
    await click("Submit for review");

    expect(server.bodies).toEqual([]);
    expect(document.body.textContent).toContain("You have unsaved changes.");
    expect(button("Save and submit")).toBeTruthy();
    expect(button("Discard changes and submit")).toBeTruthy();
    expect(button("Keep editing")).toBeTruthy();
  });

  it("'Save and submit' saves the edits first, then submits them", async () => {
    server.stored = { status: "draft", content: "Old text.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    await type(textarea(), "New text.");
    await click("Submit for review");
    await click("Save and submit");

    expect(server.bodies).toEqual([
      { status: "draft", expectedStatus: "draft", content: "New text.", attendanceCount: 40, mediaUrls: [] },
      { status: "submitted", expectedStatus: "draft" },
    ]);
    expect(server.stored).toMatchObject({ status: "submitted", content: "New text." });
  });

  it("'Discard changes and submit' submits the saved version and drops the edits", async () => {
    server.stored = { status: "draft", content: "Old text.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    await type(textarea(), "New text.");
    await click("Submit for review");
    await click("Discard changes and submit");

    expect(server.bodies).toEqual([{ status: "submitted", expectedStatus: "draft" }]);
    expect(server.stored).toMatchObject({ status: "submitted", content: "Old text." });
    expect(textarea().value).toBe("Old text.");
  });

  it("'Keep editing' sends nothing and keeps the edits", async () => {
    server.stored = { status: "draft", content: "Old text.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    await type(textarea(), "New text.");
    await click("Submit for review");
    await click("Keep editing");

    expect(server.bodies).toEqual([]);
    expect(textarea().value).toBe("New text.");
    expect(button("Submit for review")).toBeTruthy();
  });

  it("finds a submitted report locked, with no action it could take", async () => {
    server.stored = { status: "submitted", content: "Report.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 2 };
    await mount();

    expect(statusText()).toBe("Submitted");
    expect(textarea().disabled).toBe(true);
    expect(textarea().readOnly).toBe(true);
    expect(textarea().value).toBe("Report.");
    expect(document.body.textContent).toContain("Only a reviewer can reopen it");
    for (const label of ["Save draft", "Submit for review", "Mark reviewed", "Reopen to draft", "Smart Draft", "Add URL"]) {
      expect(button(label), label).toBeUndefined();
    }
  });

  it("cannot review even if it forces the request", async () => {
    // What the old status dropdown let a unit head send.
    server.stored = { status: "submitted", content: "Report.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 2 };
    const res = await fakeFetch("/vritt", { method: "POST", body: JSON.stringify({ status: "reviewed", expectedStatus: "submitted" }) });
    expect(res.status).toBe(403);
    expect(server.stored.status).toBe("submitted");
  });
});

// ── Reviewer ─────────────────────────────────────────────────────────────────

describe("a reviewer", () => {
  beforeEach(() => { server.role = "vibhag_pramukh"; });

  it("is offered review and reopen on a submitted report, with the content locked", async () => {
    server.stored = { status: "submitted", content: "Report.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 2 };
    await mount();

    expect(button("Mark reviewed")).toBeTruthy();
    expect(button("Reopen to draft")).toBeTruthy();
    expect(button("Save draft")).toBeUndefined();
    expect(textarea().disabled).toBe(true);
  });

  it("reviews with a body carrying status and notes only", async () => {
    server.stored = { status: "submitted", content: "Report.", attendanceCount: 40, mediaUrls: [], reviewNotes: null, version: 2 };
    await mount();
    await type(document.body.querySelector<HTMLTextAreaElement>("#vritt-review-notes")!, "Accepted as recorded.");
    await click("Mark reviewed");

    expect(server.bodies).toEqual([{ status: "reviewed", expectedStatus: "submitted", reviewNotes: "Accepted as recorded." }]);
    expect(server.stored).toMatchObject({ status: "reviewed", content: "Report.", reviewNotes: "Accepted as recorded." });
    expect(statusText()).toBe("Reviewed");
  });

  it("reopens a reviewed report with a status-only body, making it editable again", async () => {
    server.stored = { status: "reviewed", content: "Report.", attendanceCount: 40, mediaUrls: [], reviewNotes: "ok", version: 3 };
    await mount();
    expect(button("Mark reviewed")).toBeUndefined();
    await click("Reopen to draft");

    expect(server.bodies).toEqual([{ status: "draft", expectedStatus: "reviewed" }]);
    expect(statusText()).toBe("Draft");
    expect(textarea().disabled).toBe(false);
    expect(textarea().value).toBe("Report.");
  });
});

// ── Failures ─────────────────────────────────────────────────────────────────

describe("when a request fails", () => {
  it("explains a conflict and reloads the current report", async () => {
    server.stored = { status: "draft", content: "Mine.", attendanceCount: 1, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    // Someone submits it from another device after this sheet opened.
    server.stored = { ...server.stored, status: "submitted", version: 2 };
    await click("Submit for review");

    const alert = document.body.querySelector('[data-testid="vritt-error"]')!;
    expect(alert.textContent).toContain("This report changed while you had it open.");
    expect(alert.textContent).toContain("The latest version has been loaded below.");
    expect(statusText()).toBe("Submitted");
  });

  it("shows the server's explanation for a refusal", async () => {
    server.stored = { status: "draft", content: "Mine.", attendanceCount: 1, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    server.forceStatus = 403;
    server.forceMessage = "You do not have access to this event.";
    await click("Submit for review");

    const alert = document.body.querySelector('[data-testid="vritt-error"]')!;
    expect(alert.textContent).toContain("You are not allowed to do that.");
    expect(alert.textContent).toContain("You do not have access to this event.");
    expect(toast.addToast).toHaveBeenCalledWith("You are not allowed to do that.", "error", "You do not have access to this event.");
  });

  it("says when the network is down, and keeps the edits", async () => {
    server.stored = { status: "draft", content: "Mine.", attendanceCount: 1, mediaUrls: [], reviewNotes: null, version: 1 };
    await mount();
    await type(textarea(), "Unsent edit.");
    server.offline = true;
    await click("Save draft");

    expect(document.body.querySelector('[data-testid="vritt-error"]')!.textContent).toContain("You appear to be offline.");
    expect(textarea().value).toBe("Unsent edit.");
  });

  it("distinguishes 'no access' from 'failed' when the report cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      json(403, { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this event." } })));
    await mount();
    expect(document.body.textContent).toContain("You do not have access to this event's report.");
    expect(button("Try again")).toBeUndefined();
  });

  it("offers a retry when loading fails for another reason", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(500, { success: false, error: { code: "X", message: "boom" } })));
    await mount();
    // A server error is retried twice with backoff before it is shown; a 403
    // (above) is not retried, because it is an answer rather than a failure.
    const deadline = Date.now() + 8000;
    while (!document.body.textContent?.includes("The report could not be loaded.") && Date.now() < deadline) {
      await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    }
    expect(document.body.textContent).toContain("The report could not be loaded.");
    expect(button("Try again")).toBeTruthy();
    expect(vi.mocked(fetch).mock.calls.length).toBe(3);
  }, 12000);
});
