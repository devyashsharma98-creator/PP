import { describe, expect, it } from "vitest";

import {
  calendarDate,
  calendarDateToInstant,
  createTaskSchema,
  isRealCalendarDate,
  updateProjectSchema,
  updateTaskSchema,
} from "./tasks";

describe("calendar dates", () => {
  it("accepts what the date input sends", () => {
    expect(calendarDate.parse("2026-10-15")).toBe("2026-10-15");
  });

  it("narrows a full ISO datetime to its calendar day", () => {
    expect(calendarDate.parse("2026-10-15T09:30:00.000Z")).toBe("2026-10-15");
  });

  it("rejects a day that does not exist in that month", () => {
    // Previously accepted, and silently became 3 March.
    expect(() => calendarDate.parse("2026-02-31")).toThrow();
  });

  it("rejects an impossible month", () => {
    expect(() => calendarDate.parse("2026-13-01")).toThrow();
  });

  it("rejects a zero day and a zero month", () => {
    expect(() => calendarDate.parse("2026-01-00")).toThrow();
    expect(() => calendarDate.parse("2026-00-10")).toThrow();
  });

  it("rejects 31 April and 31 June", () => {
    expect(() => calendarDate.parse("2026-04-31")).toThrow();
    expect(() => calendarDate.parse("2026-06-31")).toThrow();
  });

  it("rejects free text", () => {
    expect(() => calendarDate.parse("tomorrow")).toThrow();
    expect(() => calendarDate.parse("")).toThrow();
  });

  it("handles leap years in both directions", () => {
    expect(isRealCalendarDate("2024-02-29")).toBe(true);   // divisible by 4
    expect(isRealCalendarDate("2026-02-29")).toBe(false);  // ordinary year
    expect(isRealCalendarDate("2000-02-29")).toBe(true);   // divisible by 400
    expect(isRealCalendarDate("1900-02-29")).toBe(false);  // divisible by 100
    expect(isRealCalendarDate("2024-02-30")).toBe(false);
  });

  it("accepts every month's real last day", () => {
    const lastDays = ["01-31","02-28","03-31","04-30","05-31","06-30","07-31","08-31","09-30","10-31","11-30","12-31"];
    for (const md of lastDays) expect(isRealCalendarDate(`2026-${md}`)).toBe(true);
  });

  it("anchors the stored instant at midnight UTC on that day", () => {
    const instant = calendarDateToInstant("2026-10-15");
    expect(instant.toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });
});

describe("task payloads from the UI", () => {
  it("accepts a due date exactly as the date input yields it", () => {
    const parsed = createTaskSchema.parse({ title: "Prepare agenda", dueDate: "2026-10-15" });
    expect(parsed.dueDate).toBe("2026-10-15");
  });

  it("refuses an impossible due date instead of shifting it", () => {
    expect(() => createTaskSchema.parse({ title: "Prepare agenda", dueDate: "2026-02-31" })).toThrow();
  });

  it("accepts an explicit null to clear the due date", () => {
    expect(updateTaskSchema.parse({ dueDate: null }).dueDate).toBeNull();
  });

  it("accepts an explicit null to clear the assignee", () => {
    const parsed = updateTaskSchema.parse({ assigneeUserId: null });
    expect(parsed.assigneeUserId).toBeNull();
    // The distinction that matters: null survives JSON, undefined does not.
    expect(JSON.parse(JSON.stringify(parsed))).toHaveProperty("assigneeUserId", null);
  });

  it("still rejects a non-uuid assignee", () => {
    expect(() => updateTaskSchema.parse({ assigneeUserId: "not-a-uuid" })).toThrow();
  });

  it("accepts an explicit null to clear a project deadline", () => {
    expect(updateProjectSchema.parse({ deadline: null }).deadline).toBeNull();
  });

  it("refuses an impossible project deadline", () => {
    expect(() => updateProjectSchema.parse({ deadline: "2026-13-01" })).toThrow();
  });
});
