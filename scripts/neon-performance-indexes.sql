-- Performance indexes for Pragya Pravah ERP
-- Run: psql $DATABASE_URL -f scripts/neon-performance-indexes.sql

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_unit_status ON events(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_author_status ON articles(author_user_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- User role assignments indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_role_assignments(role_id);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_date ON event_registrations(event_id, created_at DESC);

-- Search optimization: full-text search columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);
