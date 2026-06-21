import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/neon/env";

const databaseUrl = getDatabaseUrl();
const sql = databaseUrl ? neon(databaseUrl) : null;

type LibraryRow = {
  id: string;
  slug: string;
  title: string;
  title_hi: string;
  author: string;
  category: string;
  pages: number;
  year: string;
  rating: number;
  description: string;
  description_hi: string;
  cover_color: string;
  read_url: string | null;
  download_url: string | null;
};

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  let rows: LibraryRow[] = [];
  try {
    rows = (await sql`
      SELECT
        id, slug, title, title_hi, author, category, pages, year, rating,
        description, description_hi, cover_color, read_url, download_url
      FROM public.library_texts
      WHERE is_published = true
      ORDER BY sort_order ASC, title ASC
    `) as unknown as LibraryRow[];
  } catch {
    // Table not provisioned yet — let the client fall back to its built-in set.
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  const data = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    titleHi: r.title_hi,
    author: r.author,
    category: r.category,
    pages: r.pages,
    year: r.year,
    rating: r.rating,
    description: r.description,
    descriptionHi: r.description_hi,
    color: r.cover_color,
    readUrl: r.read_url,
    downloadUrl: r.download_url,
  }));

  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
  );
}
