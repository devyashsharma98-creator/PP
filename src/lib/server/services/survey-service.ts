import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { surveys, surveyQuestions, surveySubmissions, surveyAnswers } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { CreateSurveyInput, UpdateSurveyInput, ListSurveysQuery, SubmitSurveyInput, SurveyQuestionInput } from "@/lib/validators/surveys";
import { serverError, notFound } from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };
function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

export async function listSurveys(
  q: ListSurveysQuery,
  orgId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  try {
    const conditions: SQL<unknown>[] = [eq(surveys.orgId, orgId)];
    if (q.status) conditions.push(eq(surveys.status, q.status));
    if (q.search) conditions.push(ilike(surveys.title, `%${q.search}%`));

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: surveys.id,
          title: surveys.title,
          titleHi: surveys.titleHi,
          description: surveys.description,
          status: surveys.status,
          isPublic: surveys.isPublic,
          createdAt: surveys.createdAt,
          questionCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${surveyQuestions} WHERE ${surveyQuestions.surveyId} = ${surveys.id}), 0)`,
          responseCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${surveySubmissions} WHERE ${surveySubmissions.surveyId} = ${surveys.id}), 0)`,
        })
        .from(surveys)
        .where(whereClause)
        .orderBy(desc(surveys.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(surveys).where(whereClause).then((r) => r[0]?.count ?? 0),
    ]);

    return ok({ rows, total: totalRow });
  } catch (e) {
    console.error("listSurveys error:", e);
    return err(serverError());
  }
}

export async function getSurvey(id: string, orgId: string): Promise<Result<unknown>> {
  try {
    const row = await db
      .select()
      .from(surveys)
      .where(and(eq(surveys.id, id), eq(surveys.orgId, orgId)))
      .then((r) => r[0] ?? null);
    if (!row) return err(notFound("Survey not found."));

    const questions = await db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id))
      .orderBy(surveyQuestions.displayOrder);

    return ok({ ...row, questions });
  } catch (e) {
    console.error("getSurvey error:", e);
    return err(serverError());
  }
}

export async function createSurvey(
  input: CreateSurveyInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(surveys)
      .values({
        orgId: ctx.session.orgId,
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        scope: input.scope ?? "org",
        scopeEntityId: input.scopeEntityId ?? null,
        allowMultipleSubmissions: input.allowMultipleSubmissions ?? false,
        maxSubmissions: input.maxSubmissions ?? null,
        opensAt: input.opensAt ? new Date(input.opensAt) : null,
        closesAt: input.closesAt ? new Date(input.closesAt) : null,
        isPublic: input.isPublic ?? false,
        createdBy: ctx.session.userId,
      })
      .returning({ id: surveys.id });

    if (input.questions && input.questions.length > 0) {
      await db.insert(surveyQuestions).values(
        input.questions.map((q) => ({
          surveyId: row.id,
          questionKey: q.questionKey,
          label: q.label,
          labelHi: q.labelHi,
          questionType: q.questionType,
          isRequired: q.isRequired ?? false,
          displayOrder: q.displayOrder ?? 0,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
        })),
      );
    }

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "survey.created", actorUserId: ctx.session.userId, entityType: "survey", entityId: row.id },
      { summary: `Survey "${input.title}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createSurvey error:", e);
    return err(serverError());
  }
}

export async function updateSurvey(
  id: string,
  input: UpdateSurveyInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await db
      .select({ id: surveys.id, orgId: surveys.orgId })
      .from(surveys)
      .where(eq(surveys.id, id))
      .then((r) => r[0] ?? null);
    if (!existing || existing.orgId !== ctx.session.orgId) return err(notFound("Survey not found."));

    const [row] = await db
      .update(surveys)
      .set({
        title: input.title,
        titleHi: input.titleHi,
        description: input.description,
        descriptionHi: input.descriptionHi,
        scope: input.scope,
        scopeEntityId: input.scopeEntityId,
        status: input.status,
        allowMultipleSubmissions: input.allowMultipleSubmissions,
        maxSubmissions: input.maxSubmissions,
        opensAt: input.opensAt ? new Date(input.opensAt) : undefined,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
        isPublic: input.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(surveys.id, id))
      .returning({ id: surveys.id });

    if (input.questions) {
      await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
      if (input.questions.length > 0) {
        await db.insert(surveyQuestions).values(
          input.questions.map((q) => ({
            surveyId: id,
            questionKey: q.questionKey,
            label: q.label,
            labelHi: q.labelHi,
            questionType: q.questionType,
            isRequired: q.isRequired ?? false,
            displayOrder: q.displayOrder ?? 0,
            optionsJson: q.options ? JSON.stringify(q.options) : null,
          })),
        );
      }
    }

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "survey.updated", actorUserId: ctx.session.userId, entityType: "survey", entityId: id },
      { summary: `Survey updated.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("updateSurvey error:", e);
    return err(serverError());
  }
}

export async function deleteSurvey(id: string, ctx: AuthContext): Promise<Result<{ deleted: boolean }>> {
  try {
    const existing = await db
      .select({ id: surveys.id, orgId: surveys.orgId })
      .from(surveys)
      .where(eq(surveys.id, id))
      .then((r) => r[0] ?? null);
    if (!existing || existing.orgId !== ctx.session.orgId) return err(notFound("Survey not found."));

    await db.delete(surveys).where(eq(surveys.id, id));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "survey.deleted", actorUserId: ctx.session.userId, entityType: "survey", entityId: id },
      { summary: `Survey deleted.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok({ deleted: true });
  } catch (e) {
    console.error("deleteSurvey error:", e);
    return err(serverError());
  }
}

export async function submitSurveyResponse(
  surveyId: string,
  input: SubmitSurveyInput,
  ctx?: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const survey = await db
      .select({ id: surveys.id, status: surveys.status, allowMultipleSubmissions: surveys.allowMultipleSubmissions })
      .from(surveys)
      .where(eq(surveys.id, surveyId))
      .then((r) => r[0] ?? null);
    if (!survey) return err(notFound("Survey not found."));
    if (survey.status !== "published") return err(serverError("Survey is not accepting responses."));

    const [submission] = await db
      .insert(surveySubmissions)
      .values({
        surveyId,
        respondentName: input.respondentName ?? null,
        respondentEmail: input.respondentEmail ?? null,
        respondentPhone: input.respondentPhone ?? null,
        submittedBy: ctx?.session.userId ?? null,
      })
      .returning({ id: surveySubmissions.id });

    if (input.answers.length > 0) {
      await db.insert(surveyAnswers).values(
        input.answers.map((a) => ({
          submissionId: submission.id,
          questionKey: a.questionKey,
          value: a.value ?? null,
        })),
      );
    }

    return ok(submission);
  } catch (e) {
    console.error("submitSurveyResponse error:", e);
    return err(serverError());
  }
}

export async function listResponses(
  surveyId: string,
  orgId: string,
): Promise<Result<{ rows: unknown[] }>> {
  try {
    const survey = await db
      .select({ id: surveys.id })
      .from(surveys)
      .where(and(eq(surveys.id, surveyId), eq(surveys.orgId, orgId)))
      .then((r) => r[0] ?? null);
    if (!survey) return err(notFound("Survey not found."));

    const submissions = await db
      .select()
      .from(surveySubmissions)
      .where(eq(surveySubmissions.surveyId, surveyId))
      .orderBy(desc(surveySubmissions.submittedAt));

    const rows = await Promise.all(
      submissions.map(async (s) => {
        const answers = await db
          .select()
          .from(surveyAnswers)
          .where(eq(surveyAnswers.submissionId, s.id));
        return { ...s, answers };
      }),
    );

    return ok({ rows });
  } catch (e) {
    console.error("listResponses error:", e);
    return err(serverError());
  }
}

export async function getSurveySummary(orgId: string): Promise<Result<{ total: number; published: number; totalResponses: number }>> {
  try {
    const [totalRow] = await db.select({ count: count() }).from(surveys).where(eq(surveys.orgId, orgId));
    const [publishedRow] = await db
      .select({ count: count() })
      .from(surveys)
      .where(and(eq(surveys.orgId, orgId), eq(surveys.status, "published")));
    const [responsesRow] = await db
      .select({ count: count() })
      .from(surveySubmissions)
      .innerJoin(surveys, eq(surveySubmissions.surveyId, surveys.id))
      .where(eq(surveys.orgId, orgId));

    return ok({
      total: totalRow?.count ?? 0,
      published: publishedRow?.count ?? 0,
      totalResponses: responsesRow?.count ?? 0,
    });
  } catch (e) {
    console.error("getSurveySummary error:", e);
    return err(serverError());
  }
}
