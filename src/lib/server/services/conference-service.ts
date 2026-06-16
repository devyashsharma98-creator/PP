import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { conferences, conferenceSessions, sessionSpeakers, conferenceRegistrations } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { CreateConferenceInput, UpdateConferenceInput, ListConferencesQuery, CreateConferenceSessionInput, UpdateConferenceSessionInput, CreateSessionSpeakerInput, UpdateSessionSpeakerInput, CreateConferenceRegistrationInput } from "@/lib/validators/conferences";
import {
  serverError, notFound,
} from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };
function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

// ── Conferences ───────────────────────────────────────────────────────────────

export async function listConferences(
  q: ListConferencesQuery,
  orgId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  try {
    const conditions: SQL<unknown>[] = [eq(conferences.orgId, orgId)];
    if (q.status) conditions.push(eq(conferences.status, q.status));
    if (q.departmentId) conditions.push(eq(conferences.departmentId, q.departmentId));
    if (q.search) conditions.push(ilike(conferences.title, `%${q.search}%`));

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: conferences.id,
          title: conferences.title,
          titleHi: conferences.titleHi,
          theme: conferences.theme,
          venue: conferences.venue,
          startsAt: conferences.startsAt,
          endsAt: conferences.endsAt,
          status: conferences.status,
          departmentId: conferences.departmentId,
          unitId: conferences.unitId,
          registrationEnabled: conferences.registrationEnabled,
          createdBy: conferences.createdBy,
          createdAt: conferences.createdAt,
          sessionCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${conferenceSessions} WHERE ${conferenceSessions.conferenceId} = ${conferences.id}), 0)`,
          registrationCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${conferenceRegistrations} WHERE ${conferenceRegistrations.conferenceId} = ${conferences.id}), 0)`,
        })
        .from(conferences)
        .where(whereClause)
        .orderBy(desc(conferences.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(conferences)
        .where(whereClause)
        .then((r) => r[0]?.count ?? 0),
    ]);

    return ok({ rows, total: totalRow });
  } catch (e) {
    console.error("listConferences error:", e);
    return err(serverError());
  }
}

export async function getConference(id: string): Promise<Result<unknown>> {
  try {
    const row = await db
      .select()
      .from(conferences)
      .where(eq(conferences.id, id))
      .then((r) => r[0] ?? null);
    if (!row) return err(notFound("Conference not found."));
    return ok(row);
  } catch (e) {
    console.error("getConference error:", e);
    return err(serverError());
  }
}

export async function createConference(
  input: CreateConferenceInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(conferences)
      .values({
        orgId: ctx.session.orgId,
        title: input.title,
        titleHi: input.titleHi,
        theme: input.theme,
        themeHi: input.themeHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        venue: input.venue,
        venueHi: input.venueHi,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        unitId: input.unitId,
        departmentId: input.departmentId,
        locationId: input.locationId,
        registrationEnabled: input.registrationEnabled ?? false,
        maxRegistrations: input.maxRegistrations,
        metadata: input.metadata,
        createdBy: ctx.session.userId,
      })
      .returning({ id: conferences.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.created", actorUserId: ctx.session.userId, entityType: "conference", entityId: row.id },
      { summary: `Conference "${input.title}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createConference error:", e);
    return err(serverError());
  }
}

export async function updateConference(
  id: string,
  input: UpdateConferenceInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await db
      .select({ id: conferences.id, orgId: conferences.orgId })
      .from(conferences)
      .where(eq(conferences.id, id))
      .then((r) => r[0] ?? null);
    if (!existing) return err(notFound("Conference not found."));
    if (existing.orgId !== ctx.session.orgId) return err(notFound("Conference not found."));

    const [row] = await db
      .update(conferences)
      .set({
        title: input.title,
        titleHi: input.titleHi,
        theme: input.theme,
        themeHi: input.themeHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        venue: input.venue,
        venueHi: input.venueHi,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        unitId: input.unitId,
        departmentId: input.departmentId,
        locationId: input.locationId,
        status: input.status,
        registrationEnabled: input.registrationEnabled,
        maxRegistrations: input.maxRegistrations,
        metadata: input.metadata,
      })
      .where(eq(conferences.id, id))
      .returning({ id: conferences.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.updated", actorUserId: ctx.session.userId, entityType: "conference", entityId: id },
      { summary: `Conference updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("updateConference error:", e);
    return err(serverError());
  }
}

export async function deleteConference(id: string, ctx: AuthContext): Promise<Result<{ deleted: boolean }>> {
  try {
    const existing = await db
      .select({ id: conferences.id, orgId: conferences.orgId })
      .from(conferences)
      .where(eq(conferences.id, id))
      .then((r) => r[0] ?? null);
    if (!existing) return err(notFound("Conference not found."));
    if (existing.orgId !== ctx.session.orgId) return err(notFound("Conference not found."));

    await db.delete(conferences).where(eq(conferences.id, id));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.deleted", actorUserId: ctx.session.userId, entityType: "conference", entityId: id },
      { summary: `Conference deleted.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok({ deleted: true });
  } catch (e) {
    console.error("deleteConference error:", e);
    return err(serverError());
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessions(
  conferenceId: string,
): Promise<Result<{ rows: unknown[] }>> {
  try {
    const rows = await db
      .select({
        id: conferenceSessions.id,
        conferenceId: conferenceSessions.conferenceId,
        title: conferenceSessions.title,
        titleHi: conferenceSessions.titleHi,
        description: conferenceSessions.description,
        descriptionHi: conferenceSessions.descriptionHi,
        sessionType: conferenceSessions.sessionType,
        startsAt: conferenceSessions.startsAt,
        endsAt: conferenceSessions.endsAt,
        venue: conferenceSessions.venue,
        venueHi: conferenceSessions.venueHi,
        chairpersonName: conferenceSessions.chairpersonName,
        chairpersonNameHi: conferenceSessions.chairpersonNameHi,
        sortOrder: conferenceSessions.sortOrder,
        metadata: conferenceSessions.metadata,
        createdAt: conferenceSessions.createdAt,
        updatedAt: conferenceSessions.updatedAt,
        speakerCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${sessionSpeakers} WHERE ${sessionSpeakers.sessionId} = ${conferenceSessions.id}), 0)`,
      })
      .from(conferenceSessions)
      .where(eq(conferenceSessions.conferenceId, conferenceId))
      .orderBy(conferenceSessions.sortOrder);

    return ok({ rows });
  } catch (e) {
    console.error("listSessions error:", e);
    return err(serverError());
  }
}

export async function getSession(id: string): Promise<Result<unknown>> {
  try {
    const row = await db
      .select()
      .from(conferenceSessions)
      .where(eq(conferenceSessions.id, id))
      .then((r) => r[0] ?? null);
    if (!row) return err(notFound("Session not found."));
    return ok(row);
  } catch (e) {
    console.error("getSession error:", e);
    return err(serverError());
  }
}

export async function createSession(
  conferenceId: string,
  input: CreateConferenceSessionInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(conferenceSessions)
      .values({
        conferenceId,
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        sessionType: input.sessionType ?? "other",
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        venue: input.venue,
        venueHi: input.venueHi,
        chairpersonName: input.chairpersonName,
        chairpersonNameHi: input.chairpersonNameHi,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata,
      })
      .returning({ id: conferenceSessions.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.session.created", actorUserId: ctx.session.userId, entityType: "conference_session", entityId: row.id },
      { summary: `Session "${input.title}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createSession error:", e);
    return err(serverError());
  }
}

export async function updateSession(
  id: string,
  input: UpdateConferenceSessionInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .update(conferenceSessions)
      .set({
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        sessionType: input.sessionType,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        venue: input.venue,
        venueHi: input.venueHi,
        chairpersonName: input.chairpersonName,
        chairpersonNameHi: input.chairpersonNameHi,
        sortOrder: input.sortOrder,
        metadata: input.metadata,
      })
      .where(eq(conferenceSessions.id, id))
      .returning({ id: conferenceSessions.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.session.updated", actorUserId: ctx.session.userId, entityType: "conference_session", entityId: id },
      { summary: `Session updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("updateSession error:", e);
    return err(serverError());
  }
}

export async function deleteSession(id: string, ctx: AuthContext): Promise<Result<{ deleted: boolean }>> {
  try {
    await db.delete(conferenceSessions).where(eq(conferenceSessions.id, id));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.session.deleted", actorUserId: ctx.session.userId, entityType: "conference_session", entityId: id },
      { summary: `Session deleted.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok({ deleted: true });
  } catch (e) {
    console.error("deleteSession error:", e);
    return err(serverError());
  }
}

// ── Speakers ──────────────────────────────────────────────────────────────────

export async function listSpeakers(sessionId: string): Promise<Result<{ rows: unknown[] }>> {
  try {
    const rows = await db
      .select()
      .from(sessionSpeakers)
      .where(eq(sessionSpeakers.sessionId, sessionId))
      .orderBy(sessionSpeakers.sortOrder);
    return ok({ rows });
  } catch (e) {
    console.error("listSpeakers error:", e);
    return err(serverError());
  }
}

export async function createSpeaker(
  sessionId: string,
  input: CreateSessionSpeakerInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(sessionSpeakers)
      .values({
        sessionId,
        profileId: input.profileId ?? null,
        name: input.name,
        nameHi: input.nameHi,
        bio: input.bio,
        bioHi: input.bioHi,
        photoUrl: input.photoUrl,
        topic: input.topic,
        topicHi: input.topicHi,
        affiliation: input.affiliation,
        affiliationHi: input.affiliationHi,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning({ id: sessionSpeakers.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.speaker.created", actorUserId: ctx.session.userId, entityType: "session_speaker", entityId: row.id },
      { summary: `Speaker "${input.name}" added.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createSpeaker error:", e);
    return err(serverError());
  }
}

export async function updateSpeaker(
  id: string,
  input: UpdateSessionSpeakerInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .update(sessionSpeakers)
      .set({
        name: input.name,
        nameHi: input.nameHi,
        bio: input.bio,
        bioHi: input.bioHi,
        photoUrl: input.photoUrl,
        topic: input.topic,
        topicHi: input.topicHi,
        affiliation: input.affiliation,
        affiliationHi: input.affiliationHi,
        sortOrder: input.sortOrder,
      })
      .where(eq(sessionSpeakers.id, id))
      .returning({ id: sessionSpeakers.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.speaker.updated", actorUserId: ctx.session.userId, entityType: "session_speaker", entityId: id },
      { summary: `Speaker updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("updateSpeaker error:", e);
    return err(serverError());
  }
}

export async function deleteSpeaker(id: string, ctx: AuthContext): Promise<Result<{ deleted: boolean }>> {
  try {
    await db.delete(sessionSpeakers).where(eq(sessionSpeakers.id, id));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.speaker.deleted", actorUserId: ctx.session.userId, entityType: "session_speaker", entityId: id },
      { summary: `Speaker deleted.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok({ deleted: true });
  } catch (e) {
    console.error("deleteSpeaker error:", e);
    return err(serverError());
  }
}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function listRegistrations(conferenceId: string): Promise<Result<{ rows: unknown[] }>> {
  try {
    const rows = await db
      .select()
      .from(conferenceRegistrations)
      .where(eq(conferenceRegistrations.conferenceId, conferenceId))
      .orderBy(desc(conferenceRegistrations.submittedAt));
    return ok({ rows });
  } catch (e) {
    console.error("listRegistrations error:", e);
    return err(serverError());
  }
}

export async function createRegistration(
  conferenceId: string,
  input: CreateConferenceRegistrationInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(conferenceRegistrations)
      .values({
        conferenceId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        organization: input.organization || null,
        category: input.category ?? "delegate",
        notes: input.notes || null,
      })
      .returning({ id: conferenceRegistrations.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.registration.created", actorUserId: ctx.session.userId, entityType: "conference_registration", entityId: row.id },
      { summary: `Registration for "${input.name}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createRegistration error:", e);
    return err(serverError());
  }
}

export async function markAttendance(
  id: string,
  attended: boolean,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .update(conferenceRegistrations)
      .set({ isAttended: attended })
      .where(eq(conferenceRegistrations.id, id))
      .returning({ id: conferenceRegistrations.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "conference.attendance.marked", actorUserId: ctx.session.userId, entityType: "conference_registration", entityId: id },
      { summary: `Attendance ${attended ? "marked" : "unmarked"}.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("markAttendance error:", e);
    return err(serverError());
  }
}
