import { describe, expect, it } from "vitest";
import * as calendarModule from "./use-calendar";
import * as aalekhModule from "./use-aalekh";

describe("workflow API data mappers", () => {
  it("maps current camelCase event rows and uses API-valid calendar filters", () => {
    const module = calendarModule as typeof calendarModule & {
      buildCalendarEventsPath?: (fromDate?: string, toDate?: string) => string;
      mapApiEventToGatividhi?: (row: Record<string, unknown>) => { dateIso?: string; status: string };
    };

    expect(module.buildCalendarEventsPath).toBeTypeOf("function");
    expect(module.mapApiEventToGatividhi).toBeTypeOf("function");

    const path = module.buildCalendarEventsPath!(
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
    );
    const mapped = module.mapApiEventToGatividhi!({
      id: "event-1",
      title: "Published event",
      startsAt: "2026-06-18T10:00:00.000Z",
      status: "authorized_public",
      unitName: "Bhopal Vibhag",
    });

    expect(path).toContain("limit=100");
    expect(path).toContain("fromDate=2026-06-01T00%3A00%3A00.000Z");
    expect(path).toContain("toDate=2026-06-30T23%3A59%3A59.999Z");
    expect(mapped.dateIso).toBe("2026-06-18T10:00:00.000Z");
    expect(mapped.status).toBe("Published");
  });

  it("maps authorized public articles to the published UI status", () => {
    const module = aalekhModule as typeof aalekhModule & {
      mapApiArticleToAalekh?: (row: Record<string, unknown>) => { status: string };
    };

    expect(module.mapApiArticleToAalekh).toBeTypeOf("function");
    expect(module.mapApiArticleToAalekh!({
      id: "article-1",
      title: "Published article",
      status: "authorized_public",
    }).status).toBe("Published");
  });
});
