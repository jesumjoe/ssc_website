-- Use this script to add yourself as an Admin if you see the "Admin Access Required" error.
-- 1. Find your user ID from the email you used to sign up
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'YOUR_EMAIL@HERE.com'; -- <--- REPLACE THIS WITH YOUR EMAIL
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
        -- 2. Insert into admin_users if not exists
        INSERT INTO public.admin_users (id, full_name, role, email)
        VALUES (v_user_id, 'Admin User', 'ssc', v_email)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'User % has been added as an ssc admin.', v_email;
    ELSE
        RAISE NOTICE 'User with email % not found in auth.users. Make sure you signed up first!', v_email;
    END IF;
END $$;
