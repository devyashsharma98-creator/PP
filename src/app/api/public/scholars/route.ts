import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/neon/env";

const databaseUrl = getDatabaseUrl();
const sql = databaseUrl ? neon(databaseUrl) : null;

type ScholarRow = {
  id: string;
  slug: string;
  name: string;
  name_hi: string;
  email: string | null;
  phone: string | null;
  expertise: string[];
  affiliation: string | null;
  affiliation_hi: string | null;
  designation: string | null;
  city: string | null;
  bio: string;
  bio_hi: string;
  available_for: string[];
  photo_url: string | null;
};

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  let rows: ScholarRow[] = [];
  try {
    rows = (await sql`
      SELECT
        id, slug, name, name_hi, email, phone, expertise,
        affiliation, affiliation_hi, designation, city,
        bio, bio_hi, available_for, photo_url
      FROM public.scholars
      WHERE is_published = true
      ORDER BY sort_order ASC, name ASC
    `) as unknown as ScholarRow[];
  } catch {
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  const data = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    nameHi: r.name_hi,
    email: r.email,
    phone: r.phone,
    expertise: r.expertise,
    affiliation: r.affiliation,
    affiliationHi: r.affiliation_hi,
    designation: r.designation,
    city: r.city,
    bio: r.bio,
    bioHi: r.bio_hi,
    availableFor: r.available_for,
    photoUrl: r.photo_url,
  }));

  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
  );
}
