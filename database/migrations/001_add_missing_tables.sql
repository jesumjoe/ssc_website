-- =====================================================
-- Student Council - ADDITIONAL TABLES ONLY
-- =====================================================
-- This script adds the missing tables to your existing setup
-- Your boss already created: concerns table, evidence bucket
-- This adds: concern_timeline, admin_users, concern_assignments
-- =====================================================

-- Create custom types (if not already exist)
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('ssc', 'usc', 'faculty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CONCERN TIMELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS concern_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_concern_id ON concern_timeline(concern_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON concern_timeline(created_at);

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role admin_role NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- =====================================================
-- CONCERN ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS concern_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(concern_id, admin_id)
);

-- Create indexes for assignment queries
CREATE INDEX IF NOT EXISTS idx_assignments_concern_id ON concern_assignments(concern_id);
CREATE INDEX IF NOT EXISTS idx_assignments_admin_id ON concern_assignments(admin_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create initial timeline entry when concern is created
CREATE OR REPLACE FUNCTION create_initial_timeline()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO concern_timeline (concern_id, title, description)
    VALUES (
        NEW.id,
        'Concern Submitted',
        'Your concern has been successfully submitted and recorded.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS create_concern_timeline ON concerns;
CREATE TRIGGER create_concern_timeline
    AFTER INSERT ON concerns
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_timeline();

-- Function to create timeline entry when status changes
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO concern_timeline (concern_id, title, description)
        VALUES (
            NEW.id,
            CASE NEW.status
                WHEN 'reviewing' THEN 'Under Review'
                WHEN 'escalated' THEN 'Escalated to Higher Authority'
                WHEN 'resolved' THEN 'Concern Resolved'
                ELSE 'Status Updated'
            END,
            CASE NEW.status
                WHEN 'reviewing' THEN 'Your concern is now being reviewed by our team.'
                WHEN 'escalated' THEN 'Your concern has been escalated for priority handling.'
                WHEN 'resolved' THEN 'Your concern has been successfully resolved.'
                ELSE 'The status of your concern has been updated.'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS track_concern_status_change ON concerns;
CREATE TRIGGER track_concern_status_change
    AFTER UPDATE ON concerns
    FOR EACH ROW
    EXECUTE FUNCTION track_status_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE concern_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE concern_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONCERN TIMELINE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read timeline" ON concern_timeline;
DROP POLICY IF EXISTS "System can insert timeline" ON concern_timeline;

-- Allow anyone to read timeline entries
CREATE POLICY "Anyone can read timeline"
    ON concern_timeline
    FOR SELECT
    TO public
    USING (true);

-- Allow system to insert timeline entries (via triggers)
CREATE POLICY "System can insert timeline"
    ON concern_timeline
    FOR INSERT
    TO public
    WITH CHECK (true);

-- =====================================================
-- ADMIN USERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON admin_users;

-- Allow authenticated users to read admin info
CREATE POLICY "Authenticated users can read admin_users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- CONCERN ASSIGNMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can read assignments" ON concern_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON concern_assignments;

-- Allow admins to read all assignments
CREATE POLICY "Admins can read assignments"
    ON concern_assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
        )
    );

-- Allow admins to create assignments
CREATE POLICY "Admins can create assignments"
    ON concern_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');

-- Should return 4 rows
