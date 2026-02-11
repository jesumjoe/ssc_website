-- =====================================================
-- Student Council Application - Database Schema
-- =====================================================
-- This script creates all necessary tables, types, and policies
-- for the Student Council concern management system.
-- 
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create custom types
CREATE TYPE concern_status AS ENUM ('pending', 'reviewing', 'escalated', 'resolved');
CREATE TYPE admin_role AS ENUM ('ssc', 'usc', 'faculty');

-- =====================================================
-- CONCERNS TABLE
-- =====================================================
CREATE TABLE concerns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_number TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    email TEXT,
    student_id TEXT,
    department TEXT,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    status concern_status DEFAULT 'pending',
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_concerns_concern_number ON concerns(concern_number);
CREATE INDEX idx_concerns_status ON concerns(status);
CREATE INDEX idx_concerns_created_at ON concerns(created_at DESC);

-- =====================================================
-- CONCERN TIMELINE TABLE
-- =====================================================
CREATE TABLE concern_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster timeline queries
CREATE INDEX idx_timeline_concern_id ON concern_timeline(concern_id);
CREATE INDEX idx_timeline_created_at ON concern_timeline(created_at);

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role admin_role NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for role-based queries
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- =====================================================
-- CONCERN ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE concern_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(concern_id, admin_id)
);

-- Create indexes for assignment queries
CREATE INDEX idx_assignments_concern_id ON concern_assignments(concern_id);
CREATE INDEX idx_assignments_admin_id ON concern_assignments(admin_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on concerns table
CREATE TRIGGER update_concerns_updated_at
    BEFORE UPDATE ON concerns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to auto-create timeline entry
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

-- Trigger to track status changes
CREATE TRIGGER track_concern_status_change
    AFTER UPDATE ON concerns
    FOR EACH ROW
    EXECUTE FUNCTION track_status_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE concern_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE concern_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONCERNS TABLE POLICIES
-- =====================================================

-- Allow anyone to insert concerns (for public submissions)
CREATE POLICY "Anyone can submit concerns"
    ON concerns
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow anyone to read concerns by concern_number (for tracking)
CREATE POLICY "Anyone can read concerns by concern_number"
    ON concerns
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated admins to update concerns
CREATE POLICY "Admins can update concerns"
    ON concerns
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
        )
    );

-- =====================================================
-- CONCERN TIMELINE POLICIES
-- =====================================================

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

-- Allow authenticated users to read admin info
CREATE POLICY "Authenticated users can read admin_users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- CONCERN ASSIGNMENTS POLICIES
-- =====================================================

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
-- STORAGE BUCKET SETUP
-- =====================================================
-- Note: Storage buckets must be created via Supabase Dashboard
-- or using the Supabase Management API
-- 
-- Bucket name: evidence
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png
-- 
-- After creating the bucket, set these policies:
-- 
-- 1. Allow public uploads:
--    CREATE POLICY "Anyone can upload evidence"
--    ON storage.objects FOR INSERT
--    TO public
--    WITH CHECK (bucket_id = 'evidence');
-- 
-- 2. Allow public reads:
--    CREATE POLICY "Anyone can read evidence"
--    ON storage.objects FOR SELECT
--    TO public
--    USING (bucket_id = 'evidence');
-- =====================================================

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample admin user
-- Note: Replace the UUID with an actual auth.users ID after creating a user

-- INSERT INTO admin_users (id, full_name, role, email) VALUES
-- ('YOUR-AUTH-USER-UUID-HERE', 'John Doe', 'ssc', 'john.doe@university.edu');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup

-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');

-- Check policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
