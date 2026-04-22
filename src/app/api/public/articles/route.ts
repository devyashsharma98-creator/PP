import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/neon/env";

const databaseUrl = getDatabaseUrl();
const sql = databaseUrl ? neon(databaseUrl) : null;

type PublicArticleRow = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  author_name_snapshot: string | null;
  social_url: string | null;
  published_at: string | null;
  updated_at: string;
  channels: unknown;
};

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? 3);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(6, Math.max(1, Math.floor(parsed)));
}

function normalizeChannels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((channel): channel is string => typeof channel === "string" && channel.trim().length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeChannels(parsed);
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  return [];
}

export async function GET(req: Request) {
  if (!sql) {
    return NextResponse.json({ success: true, data: [] }, { headers: { "Cache-Control": "public, max-age=60" } });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"));

  const rows = (await sql`
    SELECT
      a.id,
      a.title,
      a.summary,
      a.category,
      a.author_name_snapshot,
      a.social_url,
      a.published_at,
      a.updated_at,
      COALESCE(
        json_agg(DISTINCT ap.channel) FILTER (WHERE ap.channel IS NOT NULL),
        '[]'::json
      ) AS channels
    FROM public.articles a
    LEFT JOIN public.article_publications ap ON ap.article_id = a.id
    WHERE a.status = 'authorized_public'
    GROUP BY
      a.id,
      a.title,
      a.summary,
      a.category,
      a.author_name_snapshot,
      a.social_url,
      a.published_at,
      a.updated_at
    ORDER BY COALESCE(a.published_at, a.updated_at) DESC
    LIMIT ${limit}
  `) as unknown as PublicArticleRow[];

  const data = rows.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary ?? "",
    category: article.category,
    authorName: article.author_name_snapshot ?? "Karyakarta",
    socialUrl: article.social_url,
    publishedAt: article.published_at ?? article.updated_at,
    channels: normalizeChannels(article.channels),
  }));

  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
  );
}
