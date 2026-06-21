import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/neon/env";

const databaseUrl = getDatabaseUrl();
const sql = databaseUrl ? neon(databaseUrl) : null;

type CampusUnitRow = {
  id: string;
  slug: string;
  name: string;
  name_hi: string;
  unit_type: string;
  city: string | null;
  state: string | null;
  coordinator_name: string | null;
  coordinator_name_hi: string | null;
  coordinator_email: string | null;
  coordinator_phone: string | null;
  member_count: number;
  status: string;
  focus_areas: string[];
  established_year: string | null;
  description: string;
  description_hi: string;
};

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  let rows: CampusUnitRow[] = [];
  try {
    rows = (await sql`
      SELECT
        id, slug, name, name_hi, unit_type, city, state,
        coordinator_name, coordinator_name_hi, coordinator_email, coordinator_phone,
        member_count, status, focus_areas, established_year,
        description, description_hi
      FROM public.campus_units
      WHERE is_published = true
      ORDER BY sort_order ASC, name ASC
    `) as unknown as CampusUnitRow[];
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
    unitType: r.unit_type,
    city: r.city,
    state: r.state,
    coordinatorName: r.coordinator_name,
    coordinatorNameHi: r.coordinator_name_hi,
    coordinatorEmail: r.coordinator_email,
    coordinatorPhone: r.coordinator_phone,
    memberCount: r.member_count,
    status: r.status,
    focusAreas: r.focus_areas,
    establishedYear: r.established_year,
    description: r.description,
    descriptionHi: r.description_hi,
  }));

  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
  );
}
