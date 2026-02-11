-- =====================================================
-- Fix RLS for Admin Login Lookup
-- =====================================================
-- This script adds a policy to allow authenticated users to see their
-- own record in the admin_users table by email. This is required for
-- the "Auto-Link" feature to work if the ID is not already set correctly.

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Create the lookup policy
-- This allows any authenticated user to SELECT rows in the admin_users table.
-- This is necessary for verifying access and displaying team members.
DROP POLICY IF EXISTS "Enable email lookup for authenticated users" ON public.admin_users;
CREATE POLICY "Enable email lookup for authenticated users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- 3. Create the update policy to allow account linking
-- This allows a user to update their own row (matched by email) to link their Auth ID.
DROP POLICY IF EXISTS "Allow users to link their IDs" ON public.admin_users;
CREATE POLICY "Allow users to link their IDs"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (email = (auth.jwt() ->> 'email'));
