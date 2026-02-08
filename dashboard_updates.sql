-- =====================================================
-- Dashboard Updates Migration
-- =====================================================

-- 1. Extend admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES admin_users(id);

-- 2. Extend concerns table
ALTER TABLE concerns
ADD COLUMN IF NOT EXISTS is_flagship BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_open_forum BOOLEAN DEFAULT FALSE;

-- 3. Update concern_status if needed
-- (Assuming solved/pending maps to existing resolved/pending)

-- 4. Sample hierarchy setup (Logic)
-- SSC.parent_id -> USC.id
-- USC.parent_id -> Faculty.id

-- 5. RLS Updates (Optional but recommended for the new hierarchy)
-- Allow admins to see users who are their children (SSCs under a USC, etc.)
DROP POLICY IF EXISTS "Admins can see their subordinates" ON admin_users;
CREATE POLICY "Admins can see their subordinates"
ON admin_users
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR 
    parent_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM admin_users AS parent
        WHERE parent.id = admin_users.parent_id AND parent.parent_id = auth.uid()
    )
);
