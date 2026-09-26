-- ==========================================
-- 1. ENUMS (Strict Data Typing)
-- ==========================================
CREATE TYPE user_role AS ENUM ('student', 'organizer');
CREATE TYPE org_role AS ENUM ('owner', 'member');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE event_category AS ENUM ('Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Music', 'Other');
CREATE TYPE registration_status AS ENUM ('confirmed', 'cancelled', 'waitlisted', 'attended');

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Organizations (Clubs/Departments)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Strictly students and organizers)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members (Many-to-Many)
CREATE TABLE organization_members (
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Events
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL, 
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  category event_category NOT NULL,
  status event_status NOT NULL DEFAULT 'published',
  capacity INT NOT NULL CHECK (capacity > 0),
  metadata JSONB DEFAULT '{}'::jsonb, 
  deleted_at TIMESTAMPTZ, -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'confirmed',
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Tracks all changes made by organizers)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, 
  user_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES (Performance & Constraints)
-- ==========================================

-- Prevents duplicate active registrations (Task 5 Fix)
CREATE UNIQUE INDEX unique_active_registration 
ON registrations(event_id, student_id) 
WHERE status IN ('confirmed', 'waitlisted');

-- Fast JSONB querying
CREATE INDEX idx_events_metadata ON events USING GIN (metadata);

-- Fast filtering for active events
CREATE INDEX idx_events_active ON events(status, deleted_at) WHERE deleted_at IS NULL;

-- ==========================================
-- 4. TRIGGERS & FUNCTIONS (Automation)
-- ==========================================

-- Auto-update `updated_at` timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Audit Logging Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events AFTER INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_registrations AFTER INSERT OR UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ==========================================
-- 5. DATABASE VIEWS (The "Magic" Seat Counter)
-- ==========================================
CREATE OR REPLACE VIEW events_with_availability AS
SELECT 
  e.*,
  COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) AS confirmed_count,
  COALESCE(COUNT(CASE WHEN r.status = 'waitlisted' THEN 1 END), 0) AS waitlisted_count,
  (e.capacity - COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0)) AS available_seats,
  CASE 
    WHEN e.capacity <= COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) THEN TRUE 
    ELSE FALSE 
  END AS is_full
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.deleted_at IS NULL
GROUP BY e.id;
