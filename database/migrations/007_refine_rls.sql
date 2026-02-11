-- Refine RLS Policies for Role-Based Access Control

-- 1. Drop existing broad policies
DROP POLICY IF EXISTS "Admins can read all concerns" ON concerns;
DROP POLICY IF EXISTS "Admins can update concerns" ON concerns;

-- 2. Helper function to get current user's role (optional but cleaner)
CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS admin_role AS $$
  SELECT role FROM admin_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. SSC: Can read all (triage role), update if pending
CREATE POLICY "SSC can read all concerns" 
ON concerns FOR SELECT 
TO authenticated 
USING (get_my_role() = 'ssc');

CREATE POLICY "SSC can update pending concerns" 
ON concerns FOR UPDATE 
TO authenticated 
USING (get_my_role() = 'ssc' AND status = 'pending');

-- 4. USC: Can read all, update reviewing/escalated/resolved
CREATE POLICY "USC can read all concerns" 
ON concerns FOR SELECT 
TO authenticated 
USING (get_my_role() = 'usc');

CREATE POLICY "USC can update active concerns" 
ON concerns FOR UPDATE 
TO authenticated 
USING (get_my_role() = 'usc' AND status IN ('reviewing', 'escalated', 'resolved'));

-- 5. FACULTY: Can readated only escalated concerns, update escalated
CREATE POLICY "Faculty can read escalated concerns" 
ON concerns FOR SELECT 
TO authenticated 
USING (get_my_role() = 'faculty' AND status = 'escalated');

CREATE POLICY "Faculty can update escalated concerns" 
ON concerns FOR UPDATE 
TO authenticated 
USING (get_my_role() = 'faculty' AND status = 'escalated');

-- 6. Assignment Override: Admins can always see concerns assigned to them
CREATE POLICY "Admins can see assigned concerns" 
ON concerns FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM concern_assignments 
    WHERE concern_assignments.concern_id = concerns.id 
    AND concern_assignments.admin_id = auth.uid()
  )
);

-- 7. Timeline access
DROP POLICY IF EXISTS "Admins can read timeline" ON concern_timeline;
CREATE POLICY "Admins can read relevant timeline" 
ON concern_timeline FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM concerns 
    WHERE concerns.id = concern_timeline.concern_id 
    -- The user must be able to read the concern to see its timeline
  )
);
