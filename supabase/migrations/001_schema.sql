-- ============================================================
-- 001_schema.sql — Core tables
-- ============================================================

-- gen_random_uuid() is built into PostgreSQL 13+ — no extension needed.

-- ============================================================
-- Custom types
-- ============================================================
CREATE TYPE org_type AS ENUM ('personal', 'team');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- ============================================================
-- profiles — extends auth.users
-- ============================================================
CREATE TABLE profiles (
  id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT        NOT NULL,
  full_name  TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- organizations
-- ============================================================
CREATE TABLE organizations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  type       org_type    NOT NULL DEFAULT 'personal',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- organization_members
-- ============================================================
CREATE TABLE organization_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- projects
-- ============================================================
CREATE TABLE projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  description TEXT,
  is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- ============================================================
-- project_members
-- ============================================================
CREATE TABLE project_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- invitations
-- ============================================================
CREATE TABLE invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        member_role NOT NULL,
  token       UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_org_members_org_id     ON organization_members(org_id);
CREATE INDEX idx_org_members_user_id    ON organization_members(user_id);
CREATE INDEX idx_projects_org_id        ON projects(org_id);
CREATE INDEX idx_project_members_proj   ON project_members(project_id);
CREATE INDEX idx_project_members_user   ON project_members(user_id);
CREATE INDEX idx_invitations_token      ON invitations(token);
CREATE INDEX idx_invitations_email      ON invitations(email);
CREATE INDEX idx_invitations_org_id     ON invitations(org_id);

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
