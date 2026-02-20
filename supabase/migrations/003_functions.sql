-- ============================================================
-- 003_functions.sql — Database functions and triggers
-- ============================================================

-- ============================================================
-- handle_new_user — called on auth.users INSERT
-- Creates: profile, personal org, default project, owner membership
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id     UUID;
  v_project_id UUID;
  v_base_slug  TEXT;
  v_slug       TEXT;
  v_counter    INT := 0;
  v_full_name  TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insert profile
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Generate unique org slug
  v_base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(v_full_name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  v_slug := v_base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug);
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;

  -- Create personal organization
  INSERT INTO organizations (name, slug, type)
  VALUES (v_full_name || '''s workspace', v_slug, 'personal')
  RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  -- Create default project
  INSERT INTO projects (org_id, name, slug, is_default)
  VALUES (v_org_id, 'Default', 'default', TRUE)
  RETURNING id INTO v_project_id;

  -- Add user as owner of project
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- accept_invitation — callable by the invited user (RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv        invitations%ROWTYPE;
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT * INTO v_inv
  FROM invitations
  WHERE token = invitation_token;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invitation not found');
  END IF;

  IF v_inv.accepted_at IS NOT NULL THEN
    RETURN json_build_object('error', 'Invitation has already been accepted');
  END IF;

  IF v_inv.expires_at < NOW() THEN
    RETURN json_build_object('error', 'Invitation has expired');
  END IF;

  IF v_inv.email != v_user_email THEN
    RETURN json_build_object('error', 'This invitation was sent to a different email address');
  END IF;

  -- Add to organization
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_inv.org_id, auth.uid(), v_inv.role)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Add to project if project-specific
  IF v_inv.project_id IS NOT NULL THEN
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (v_inv.project_id, auth.uid(), v_inv.role)
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  -- Mark accepted
  UPDATE invitations
  SET accepted_at = NOW()
  WHERE id = v_inv.id;

  RETURN json_build_object(
    'success', true,
    'org_id', v_inv.org_id,
    'org_slug', (SELECT slug FROM organizations WHERE id = v_inv.org_id)
  );
END;
$$;

-- ============================================================
-- get_user_organizations — returns orgs with current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  slug       TEXT,
  type       org_type,
  avatar_url TEXT,
  role       member_role,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.name,
    o.slug,
    o.type,
    o.avatar_url,
    om.role,
    o.created_at
  FROM organizations o
  JOIN organization_members om ON om.org_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY o.created_at ASC;
$$;
