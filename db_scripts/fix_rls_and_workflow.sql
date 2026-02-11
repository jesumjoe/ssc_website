-- ==========================================
-- 0. Schema Fixes (Missing Columns)
-- ==========================================

DO $$
BEGIN
    -- Severity Column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concerns' AND column_name = 'severity') THEN
        ALTER TABLE concerns ADD COLUMN severity INTEGER CHECK (severity >= 1 AND severity <= 5);
    END IF;

    -- Flagship & Open Forum (Used in Dashboard)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concerns' AND column_name = 'is_flagship') THEN
        ALTER TABLE concerns ADD COLUMN is_flagship BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concerns' AND column_name = 'is_open_forum') THEN
        ALTER TABLE concerns ADD COLUMN is_open_forum BOOLEAN DEFAULT FALSE;
    END IF;

    -- New Workflow Columns (Faculty Remarks & Final Message)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concerns' AND column_name = 'faculty_response') THEN
        ALTER TABLE concerns ADD COLUMN faculty_response TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concerns' AND column_name = 'final_response') THEN
        ALTER TABLE concerns ADD COLUMN final_response TEXT;
    END IF;
END $$;

-- ==========================================
-- 1. Fix RLS for Update (Security Definer Approach)
-- ==========================================

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update concerns" ON concerns;

-- Create new robust policy
CREATE POLICY "Admins can update concerns"
ON concerns
FOR UPDATE
TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- Also fix assignment RLS just in case
DROP POLICY IF EXISTS "Admins can create assignments" ON concern_assignments;
CREATE POLICY "Admins can create assignments"
ON concern_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.check_is_admin());

DROP POLICY IF EXISTS "Admins can read assignments" ON concern_assignments;
CREATE POLICY "Admins can read assignments"
ON concern_assignments
FOR SELECT
TO authenticated
USING (public.check_is_admin());

-- ==========================================
-- 2. Auto-Assignment Trigger (2 SSC + 1 USC)
-- ==========================================

CREATE OR REPLACE FUNCTION auto_assign_admins()
RETURNS TRIGGER AS $$
DECLARE
  ssc_admins UUID[];
  usc_admin UUID;
  admin_id UUID;
BEGIN
  -- 1. Select 2 Random SSCs
  SELECT ARRAY(
    SELECT id FROM admin_users
    WHERE role = 'ssc'
    ORDER BY random()
    LIMIT 2
  ) INTO ssc_admins;

  -- 2. Select 1 Random USC
  SELECT id INTO usc_admin
  FROM admin_users
  WHERE role = 'usc'
  ORDER BY random()
  LIMIT 1;

  -- 3. Insert Assignments
  
  -- Insert SSCs
  IF ssc_admins IS NOT NULL THEN
    FOREACH admin_id IN ARRAY ssc_admins
    LOOP
      INSERT INTO concern_assignments (concern_id, admin_id)
      VALUES (NEW.id, admin_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Insert USC
  IF usc_admin IS NOT NULL THEN
    INSERT INTO concern_assignments (concern_id, admin_id)
    VALUES (NEW.id, usc_admin)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS trigger_auto_assign_admins ON concerns;

-- Create Trigger
CREATE TRIGGER trigger_auto_assign_admins
AFTER INSERT ON concerns
FOR EACH ROW
EXECUTE FUNCTION auto_assign_admins();
