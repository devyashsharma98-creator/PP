-- Pragya Pravah ERP: Bhopal Vibhag V1 Rollout Alignment
-- Target: production-ready, additive, idempotent migration.

BEGIN;

-- ==========================================
-- 1. EXTEND UNITS HIERARCHY
-- ==========================================
DO $$ 
BEGIN
    -- Detect and drop the existing constraint if it exists
    ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_kind_check;
    
    -- Add the expanded hierarchy constraint
    ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check 
        CHECK (unit_kind IN ('kshetra', 'prant', 'vibhag', 'zila', 'unit'));
EXCEPTION 
    WHEN undefined_object THEN 
        -- If for some reason it wasn't there, just add it
        ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check 
            CHECK (unit_kind IN ('kshetra', 'prant', 'vibhag', 'zila', 'unit'));
END $$;


-- ==========================================
-- 2. EXTEND EVENTS WITH STRUCTURED VRITT
-- ==========================================
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS vritt_attendance_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vritt_media_urls text[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS vritt_content text,
    ADD COLUMN IF NOT EXISTS vritt_status text DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS vritt_updated_at timestamptz DEFAULT now();

-- Add Vritt status check constraint
DO $$ BEGIN
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_vritt_status_check;
    ALTER TABLE public.events ADD CONSTRAINT events_vritt_status_check 
        CHECK (vritt_status IN ('draft', 'submitted', 'reviewed'));
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Backfill: Copy legacy report text into the new structured content column
UPDATE public.events 
SET vritt_content = report 
WHERE (vritt_content IS NULL OR vritt_content = '') 
  AND (report IS NOT NULL AND report <> '');


-- ==========================================
-- 3. EXTEND ARTICLES
-- ==========================================
ALTER TABLE public.articles 
    ADD COLUMN IF NOT EXISTS document_url text;


-- ==========================================
-- 4. EXTEND PRACHAR_STATUSES
-- ==========================================
ALTER TABLE public.prachar_statuses
    ADD COLUMN IF NOT EXISTS whatsapp_skip_reason text,
    ADD COLUMN IF NOT EXISTS facebook_skip_reason text,
    ADD COLUMN IF NOT EXISTS instagram_skip_reason text,
    ADD COLUMN IF NOT EXISTS telegram_skip_reason text,
    ADD COLUMN IF NOT EXISTS template_reference text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ==========================================
-- 5. CREATE VIMARSH KNOWLEDGE HUB
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vimarsh_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.org_settings(id) ON DELETE CASCADE,
    title text NOT NULL,
    title_hi text,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vimarsh_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL REFERENCES public.vimarsh_topics(id) ON DELETE CASCADE,
    resource_type text NOT NULL CHECK (resource_type IN ('link', 'video', 'book')),
    title text NOT NULL,
    url text NOT NULL,
    created_at timestamptz DEFAULT now()
);


-- ==========================================
-- 6. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vimarsh_topics_org_id ON public.vimarsh_topics(org_id);
CREATE INDEX IF NOT EXISTS idx_vimarsh_resources_topic_id ON public.vimarsh_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_events_vritt_status ON public.events(vritt_status);


-- ==========================================
-- 7. RLS ENABLEMENT & POLICIES
-- ==========================================
ALTER TABLE public.vimarsh_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vimarsh_resources ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Vimarsh Topics
DROP POLICY IF EXISTS p_vimarsh_topics_read ON public.vimarsh_topics;
CREATE POLICY p_vimarsh_topics_read ON public.vimarsh_topics
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_vimarsh_topics_manage ON public.vimarsh_topics;
CREATE POLICY p_vimarsh_topics_manage ON public.vimarsh_topics
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- Idempotent Policy Creation for Vimarsh Resources
DROP POLICY IF EXISTS p_vimarsh_resources_read ON public.vimarsh_resources;
CREATE POLICY p_vimarsh_resources_read ON public.vimarsh_resources
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_vimarsh_resources_manage ON public.vimarsh_resources;
CREATE POLICY p_vimarsh_resources_manage ON public.vimarsh_resources
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());


-- ==========================================
-- 8. TRIGGERS
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_vimarsh_topics') THEN
        CREATE TRIGGER trg_set_updated_at_vimarsh_topics 
        BEFORE UPDATE ON public.vimarsh_topics 
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;


-- ==========================================
-- 9. SEED CANONICAL AAYAMS
-- ==========================================
-- We find the org_id dynamically using the confirmed 'pragya-pravah' code
INSERT INTO public.departments_or_aayams (org_id, code, name, name_hi, department_kind)
SELECT id, code, name, name_hi, 'aayam'
FROM (
    SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah' LIMIT 1
) AS org,
(VALUES 
    ('yuva', 'Yuva', 'युवा'),
    ('mahila', 'Mahila', 'महिला'),
    ('shodh', 'Shodh', 'शोध'),
    ('prachar', 'Prachar', 'प्रचार'),
    ('vimarsh', 'Vimarsh', 'विमर्श')
) AS v(code, name, name_hi)
ON CONFLICT (org_id, code) DO UPDATE 
SET name = EXCLUDED.name, 
    name_hi = EXCLUDED.name_hi,
    updated_at = now();

COMMIT;
