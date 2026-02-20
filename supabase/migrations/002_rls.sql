-- ============================================================
-- 002_rls.sql — Row Level Security policies
-- ============================================================

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow org members to view co-member profiles
CREATE POLICY "profiles_select_org_member"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om1
      JOIN organization_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
    )
  );

-- ============================================================
-- organizations
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_member"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = organizations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_authenticated"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations_update_admin"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "organizations_delete_owner"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- ============================================================
-- organization_members
-- ============================================================
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select_same_org"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_admin"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR auth.uid() = organization_members.user_id  -- allow self-join via invite accept
  );

CREATE POLICY "org_members_update_admin"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_delete_admin_or_self"
  ON organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- projects
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_org_member"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "projects_insert_admin"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = projects.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "projects_update_admin"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = projects.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "projects_delete_admin"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = projects.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- project_members
-- ============================================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_select_org_member"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      JOIN projects p ON p.org_id = om.org_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "project_members_insert_admin"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM organization_members om
      JOIN projects p ON p.org_id = om.org_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR auth.uid() = project_members.user_id
  );

CREATE POLICY "project_members_update_admin"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      JOIN projects p ON p.org_id = om.org_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "project_members_delete_admin_or_self"
  ON project_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      JOIN projects p ON p.org_id = om.org_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- invitations
-- ============================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select_admin_or_invitee"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_insert_admin"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "invitations_update_admin_or_invitee"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_delete_admin"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
