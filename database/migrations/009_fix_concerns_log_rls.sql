-- =====================================================
-- FIX: RLS Policy for concerns_log
-- =====================================================
-- This script fixes the "new row violates row-level security policy for table 'concerns_log'" error.
-- It occurs because a trigger on the 'concerns' table is trying to insert a log entry, 
-- but the anonymous user (submitting the concern) does not have INSERT permissions on 'concerns_log'.

-- 1. Ensure RLS is enabled on concerns_log (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'concerns_log') THEN
        ALTER TABLE public.concerns_log ENABLE ROW LEVEL SECURITY;
        
        -- 2. Drop the policy if it exists to recreate it
        DROP POLICY IF EXISTS "Allow public to insert into concerns_log" ON public.concerns_log;
        
        -- 3. Create the policy allowing anyone (including anonymous users submitting concerns) to insert
        CREATE POLICY "Allow public to insert into concerns_log"
        ON public.concerns_log
        FOR INSERT
        TO public
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Just in case you renamed 'concern_timeline' or are using it for logging, we'll ensure it has the same policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'concern_timeline') THEN
        ALTER TABLE public.concern_timeline ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "System can insert timeline" ON public.concern_timeline;
        
        CREATE POLICY "System can insert timeline"
        ON public.concern_timeline
        FOR INSERT
        TO public
        WITH CHECK (true);
    END IF;
END $$;

SELECT 'RLS Fix Applied Successfully!' as result;
