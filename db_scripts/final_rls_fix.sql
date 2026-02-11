-- =====================================================
-- FINAL RLS RESET & FIX
-- =====================================================
-- This script deletes the recursive policies that were causing
-- the "Internal Database Error" and replaces them with safe versions.

-- 1. Drop ALL existing policies on admin_users to start fresh
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can see their subordinates" ON public.admin_users;
DROP POLICY IF EXISTS "Enable email lookup for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to link their IDs" ON public.admin_users;

-- 2. Create a SIMPLE, NON-RECURSIVE lookup policy
-- This allows any logged-in user to see the admin list.
-- This is standard for most apps so you can see who your team members are.
CREATE POLICY "Admin visibility for all authenticated users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- 3. Create a SIMPLE update policy for account linking
-- This allows a user to update their own row (matched by email) to link their ID.
CREATE POLICY "User can update own profile by email"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (email = (auth.jwt() ->> 'email'));

-- 4. Enable RLS (just in case it was toggled)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- SUCCESS MESSAGE
-- (No RAISE NOTICE here to avoid syntax errors)
SELECT 'RLS Reset Successfully!' as result;
