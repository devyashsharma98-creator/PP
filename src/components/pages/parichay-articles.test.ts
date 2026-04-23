import { describe, expect, it } from "vitest";

import {
  buildArticleShowcaseItems,
  normalizePublishedArticle,
  type PublicArticleSummary,
} from "@/components/pages/parichay-articles";

describe("parichay article showcase helpers", () => {
  it("normalizes a published article into showcase content", () => {
    const article: PublicArticleSummary = {
      id: "article-1",
      title: "Mock Approved Karyakarta Article",
      summary: "A vetted article summary ready for public social publishing.",
      category: "shodh",
      authorName: "Mock Karyakarta",
      socialUrl: "https://example.com/social-post",
      publishedAt: "2026-04-22T00:00:00.000Z",
    };

    expect(normalizePublishedArticle(article)).toMatchObject({
      titleEn: "Mock Approved Karyakarta Article",
      titleHi: "Mock Approved Karyakarta Article",
      authorEn: "Mock Karyakarta",
      authorHi: "Mock Karyakarta",
      laneEn: "Published article",
      laneHi: "प्रकाशित आलेख",
      channels: ["Shodh", "Website", "Social"],
    });
  });

  it("replaces placeholders when published public articles are available", () => {
    const items = buildArticleShowcaseItems([
      {
        id: "article-1",
        title: "Mock Approved Karyakarta Article",
        summary: "A vetted article summary ready for public social publishing.",
        category: "shodh",
        authorName: "Mock Karyakarta",
        socialUrl: "https://example.com/social-post",
        publishedAt: "2026-04-22T00:00:00.000Z",
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.titleEn).toBe("Mock Approved Karyakarta Article");
    expect(items[0]?.authorEn).toBe("Mock Karyakarta");
  });
});
