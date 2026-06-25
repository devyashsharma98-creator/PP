import "server-only";

import { notFound } from "next/navigation";
import { and, eq, or, ilike } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db/client";
import { articles, scholars } from "@/db/schema/index";
import { requirePageSession } from "@/lib/server/require-page-session";
import { resolveScopedAccess, rowMatchesScope } from "@/lib/app/scope";
import { dbToUiArticleStatus } from "@/lib/app/status-maps";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, CalendarDays, ExternalLink, FileText, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function AalekhDetailPage({ params }: Params) {
  const session = await requirePageSession("/aalekh");
  const { id } = await params;

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, id), eq(articles.orgId, session.orgId)),
    with: { author: { columns: { id: true, displayName: true } } },
  });

  if (!article) notFound();

  const scopedAccess = resolveScopedAccess(session.assignments);
  const isAuthor = article.authorUserId === session.userId;
  const isPublished = article.status === "authorized_public";
  if (!isPublished && !isAuthor && !rowMatchesScope(scopedAccess, article, session.userId)) {
    notFound();
  }

  const authorName =
    article.authorNameSnapshot ??
    (article.author as { displayName: string | null } | null)?.displayName ??
    "Unknown";

  const linkedScholar = article.authorUserId
    ? await db.query.scholars.findFirst({
        where: and(eq(scholars.linkedProfileId, article.authorUserId), eq(scholars.orgId, session.orgId)),
        columns: { slug: true, name: true },
      })
    : null;

  const scholarByName = !linkedScholar && authorName !== "Unknown"
    ? await db.query.scholars.findFirst({
        where: and(
          eq(scholars.orgId, session.orgId),
          or(
            ilike(scholars.name, authorName),
            ilike(scholars.nameHi, authorName),
          ),
        ),
        columns: { slug: true, name: true },
      })
    : null;

  const scholarLink = linkedScholar ?? scholarByName;

  const uiStatus = dbToUiArticleStatus[article.status] ?? article.status;
  const publishedDate = article.publishedAt ?? article.createdAt;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <Link
        href="/aalekh"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Aalekh
      </Link>

      <Card className="institution-panel">
        <CardContent className="py-8 px-6 md:px-10 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
              {article.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
              {uiStatus}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 opacity-60" />
              {scholarLink ? (
                <Link href={`/scholars/${scholarLink.slug}`} className="text-primary hover:underline inline-flex items-center gap-1">
                  {authorName}
                  <GraduationCap className="w-3 h-3" />
                </Link>
              ) : (
                authorName
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 opacity-60" />
              {new Date(publishedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          {article.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 italic">
              {article.summary}
            </p>
          )}

          {article.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content.</p>
          )}

          {(article.socialUrl || article.documentUrl) && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              {article.socialUrl && (
                <a href={article.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Source
                </a>
              )}
              {article.documentUrl && (
                <a href={article.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <FileText className="w-3.5 h-3.5" /> Document
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
