-- Phase 4: Vimarsh→Aalekh provenance + Scholar weekly availability

-- Articles: link to the Vimarsh charcha thread this article was drafted from
ALTER TABLE "articles" ADD COLUMN "source_thread_id" uuid REFERENCES "vimarsh_threads"("id") ON DELETE SET NULL;--> statement-breakpoint

-- Scholars: weekly recurring availability schedule (jsonb)
ALTER TABLE "scholars" ADD COLUMN "availability" jsonb NOT NULL DEFAULT '{}'::jsonb;
