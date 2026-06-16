import "server-only";
import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { volunteerProfiles, volunteerActivities, profiles } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { ScopedAccess } from "@/lib/app/scope";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { UpdateVolunteerProfileInput, CreateVolunteerActivityInput, ListVolunteersQuery } from "@/lib/validators/volunteers";
import { serverError, notFound } from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };
function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

export async function listVolunteers(
  q: ListVolunteersQuery,
  orgId: string,
  scopedAccess: ScopedAccess,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const conditions: SQL<unknown>[] = [eq(volunteerProfiles.orgId, orgId)];
  if (q.search) {
    const searchClause = or(
      ilike(profiles.displayName, `%${q.search}%`),
      ilike(profiles.email, `%${q.search}%`),
    );
    if (searchClause) conditions.push(searchClause);
  }

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [eq(volunteerProfiles.orgId, orgId)];
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  const whereClause = and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: volunteerProfiles.id,
        profileId: volunteerProfiles.profileId,
        displayName: profiles.displayName,
        email: profiles.email,
        skills: volunteerProfiles.skills,
        joinedAt: volunteerProfiles.joinedAt,
        serviceSpanMonths: volunteerProfiles.serviceSpanMonths,
        totalHours: sql<number>`COALESCE((SELECT SUM(${volunteerActivities.hoursLogged}) FROM ${volunteerActivities} WHERE ${volunteerActivities.volunteerId} = ${volunteerProfiles.id}), 0)`,
        activityCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${volunteerActivities} WHERE ${volunteerActivities.volunteerId} = ${volunteerProfiles.id}), 0)`,
      })
      .from(volunteerProfiles)
      .leftJoin(profiles, eq(volunteerProfiles.profileId, profiles.id))
      .where(whereClause)
      .orderBy(desc(volunteerProfiles.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(volunteerProfiles).where(whereClause),
  ]);

  return ok({ rows, total: totalRow[0]?.total ?? 0 });
}

export async function getVolunteer(volunteerId: string, orgId: string): Promise<Result<unknown>> {
  const [row] = await db
    .select({
      id: volunteerProfiles.id,
      profileId: volunteerProfiles.profileId,
      displayName: profiles.displayName,
      email: profiles.email,
      skills: volunteerProfiles.skills,
      availability: volunteerProfiles.availability,
      joinedAt: volunteerProfiles.joinedAt,
      serviceSpanMonths: volunteerProfiles.serviceSpanMonths,
      emergencyContact: volunteerProfiles.emergencyContact,
      notes: volunteerProfiles.notes,
    })
    .from(volunteerProfiles)
    .leftJoin(profiles, eq(volunteerProfiles.profileId, profiles.id))
    .where(and(eq(volunteerProfiles.id, volunteerId), eq(volunteerProfiles.orgId, orgId)));

  if (!row) return err(notFound("Volunteer not found."));
  return ok(row);
}

export async function updateVolunteerProfile(
  volunteerId: string,
  input: UpdateVolunteerProfileInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  const [existing] = await db
    .select({ id: volunteerProfiles.id })
    .from(volunteerProfiles)
    .where(and(eq(volunteerProfiles.id, volunteerId), eq(volunteerProfiles.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Volunteer profile not found."));

  const [updated] = await db
    .update(volunteerProfiles)
    .set({
      ...input,
      joinedAt: input.joinedAt ? new Date(input.joinedAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(volunteerProfiles.id, volunteerId))
    .returning({ id: volunteerProfiles.id });

  if (!updated) return err(serverError("Failed to update volunteer profile."));
  return ok(updated);
}

export async function getOrCreateVolunteerProfile(
  profileId: string,
  orgId: string,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  const [created] = await db
    .insert(volunteerProfiles)
    .values({ profileId, orgId })
    .onConflictDoNothing({ target: volunteerProfiles.profileId })
    .returning({ id: volunteerProfiles.id });

  if (created) return ok(created);

  const [existing] = await db
    .select({ id: volunteerProfiles.id })
    .from(volunteerProfiles)
    .where(and(eq(volunteerProfiles.profileId, profileId), eq(volunteerProfiles.orgId, orgId)));

  if (!existing) return err(serverError("Failed to get or create volunteer profile."));
  return ok(existing);
}

export async function listActivities(
  volunteerId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: volunteerActivities.id,
        volunteerId: volunteerActivities.volunteerId,
        activityType: volunteerActivities.activityType,
        description: volunteerActivities.description,
        hoursLogged: volunteerActivities.hoursLogged,
        date: volunteerActivities.date,
        eventId: volunteerActivities.eventId,
      })
      .from(volunteerActivities)
      .where(eq(volunteerActivities.volunteerId, volunteerId))
      .orderBy(desc(volunteerActivities.date))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(volunteerActivities).where(eq(volunteerActivities.volunteerId, volunteerId)),
  ]);

  return ok({ rows, total: totalRow[0]?.total ?? 0 });
}

export async function createActivity(
  volunteerId: string,
  input: CreateVolunteerActivityInput,
  ctx: AuthContext,
): Promise<Result<{ id: string; activityType: string }>> {
  const [activity] = await db
    .insert(volunteerActivities)
    .values({
      volunteerId,
      orgId: ctx.session.orgId,
      activityType: input.activityType ?? "other",
      description: input.description,
      hoursLogged: input.hoursLogged,
      date: new Date(input.date),
      eventId: input.eventId ?? null,
      recordedBy: ctx.session.userId,
    })
    .returning({ id: volunteerActivities.id, activityType: volunteerActivities.activityType });

  if (!activity) return err(serverError("Failed to create activity."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "volunteer.activity_logged", actorUserId: ctx.session.userId, entityType: "volunteer_activity", entityId: activity.id },
    { summary: `Activity logged: ${input.activityType}`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(activity);
}

export async function deleteActivity(activityId: string, ctx: AuthContext): Promise<Result<void>> {
  const [existing] = await db
    .select({ id: volunteerActivities.id })
    .from(volunteerActivities)
    .where(and(eq(volunteerActivities.id, activityId), eq(volunteerActivities.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Activity not found."));
  await db.delete(volunteerActivities).where(eq(volunteerActivities.id, activityId));
  return ok(undefined);
}

export async function getDashboardSummary(orgId: string): Promise<Result<{ total: number; recentActivities: number }>> {
  const [totalRow] = await db.select({ total: count() }).from(volunteerProfiles).where(eq(volunteerProfiles.orgId, orgId));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recentRow] = await db
    .select({ total: count() })
    .from(volunteerActivities)
    .where(and(eq(volunteerActivities.orgId, orgId), sql`${volunteerActivities.date} >= ${thirtyDaysAgo}`));

  return ok({ total: totalRow?.total ?? 0, recentActivities: recentRow?.total ?? 0 });
}
