import { describe, expect, it } from "vitest";

import {
  buildVrittRequest,
  cleanMediaUrls,
  isVrittFormDirty,
  vrittFormFromStored,
  type StoredVritt,
  type VrittFormState,
} from "./vritt-payload";

const form: VrittFormState = {
  content: "Sixty attended the baithak.",
  attendanceCount: 60,
  mediaUrls: ["https://example.org/a.jpg", "  ", ""],
};

const storedDraft: StoredVritt = {
  status: "draft",
  content: "Sixty attended the baithak.",
  contentHi: null,
  attendanceCount: 60,
  mediaUrls: ["https://example.org/a.jpg"],
  reviewNotes: null,
  updatedAt: "2026-09-10T10:00:00.000Z",
};

const CONTENT_KEYS = ["content", "contentHi", "attendanceCount", "mediaUrls"];

describe("request bodies", () => {
  it("a draft save carries the content, with blank media rows dropped", () => {
    expect(buildVrittRequest("saveDraft", { form, expectedStatus: null })).toEqual({
      status: "draft",
      expectedStatus: null,
      content: "Sixty attended the baithak.",
      attendanceCount: 60,
      mediaUrls: ["https://example.org/a.jpg"],
    });
  });

  it("a submission carries only its status", () => {
    const body = buildVrittRequest("submit", { form, expectedStatus: "draft" });
    expect(body).toEqual({ status: "submitted", expectedStatus: "draft" });
    for (const key of CONTENT_KEYS) expect(body).not.toHaveProperty(key);
  });

  it("a review carries its status and trimmed notes, never content", () => {
    const body = buildVrittRequest("review", { form, expectedStatus: "submitted", reviewNotes: "  Accepted.  " });
    expect(body).toEqual({ status: "reviewed", expectedStatus: "submitted", reviewNotes: "Accepted." });
    for (const key of CONTENT_KEYS) expect(body).not.toHaveProperty(key);
  });

  it("a review with blank notes sends no notes key", () => {
    expect(buildVrittRequest("review", { form, expectedStatus: "submitted", reviewNotes: "   " })).toEqual({
      status: "reviewed",
      expectedStatus: "submitted",
    });
  });

  it("a reopening carries only its status", () => {
    const body = buildVrittRequest("reopen", { form, expectedStatus: "reviewed", reviewNotes: "ignored" });
    expect(body).toEqual({ status: "draft", expectedStatus: "reviewed" });
    for (const key of CONTENT_KEYS) expect(body).not.toHaveProperty(key);
    expect(body).not.toHaveProperty("reviewNotes");
  });

  it("clamps a negative or fractional attendance", () => {
    const body = buildVrittRequest("saveDraft", { form: { ...form, attendanceCount: -3.7 }, expectedStatus: "draft" });
    expect(body).toMatchObject({ attendanceCount: 0 });
  });

  it("survives JSON exactly — no undefined keys that would vanish in transit", () => {
    for (const action of ["saveDraft", "submit", "review", "reopen"] as const) {
      const body = buildVrittRequest(action, { form, expectedStatus: "draft", reviewNotes: "n" });
      expect(JSON.parse(JSON.stringify(body))).toEqual(body);
    }
  });
});

describe("unsaved edits", () => {
  it("are absent right after loading", () => {
    expect(isVrittFormDirty(vrittFormFromStored(storedDraft), storedDraft)).toBe(false);
  });

  it("are detected in the text", () => {
    expect(isVrittFormDirty({ ...vrittFormFromStored(storedDraft), content: "Changed" }, storedDraft)).toBe(true);
  });

  it("are detected in the attendance", () => {
    expect(isVrittFormDirty({ ...vrittFormFromStored(storedDraft), attendanceCount: 61 }, storedDraft)).toBe(true);
  });

  it("are detected in media", () => {
    const edited = { ...vrittFormFromStored(storedDraft), mediaUrls: ["https://example.org/b.jpg"] };
    expect(isVrittFormDirty(edited, storedDraft)).toBe(true);
  });

  it("ignore an added-then-empty media row", () => {
    const edited = { ...vrittFormFromStored(storedDraft), mediaUrls: ["https://example.org/a.jpg", ""] };
    expect(isVrittFormDirty(edited, storedDraft)).toBe(false);
  });

  it("count any text typed into a report that does not exist yet", () => {
    expect(isVrittFormDirty({ content: "x", attendanceCount: 0, mediaUrls: [""] }, null)).toBe(true);
    expect(isVrittFormDirty(vrittFormFromStored(null), null)).toBe(false);
  });
});

describe("loading the form", () => {
  it("keeps one empty media row to type into", () => {
    expect(vrittFormFromStored(null).mediaUrls).toEqual([""]);
    expect(vrittFormFromStored({ ...storedDraft, mediaUrls: [] }).mediaUrls).toEqual([""]);
  });

  it("does not share the stored array", () => {
    const loaded = vrittFormFromStored(storedDraft);
    loaded.mediaUrls.push("x");
    expect(storedDraft.mediaUrls).toEqual(["https://example.org/a.jpg"]);
  });

  it("cleans media rows", () => {
    expect(cleanMediaUrls([" https://a ", "", "  "])).toEqual(["https://a"]);
  });
});
