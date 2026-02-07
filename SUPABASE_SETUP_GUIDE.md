# Supabase Setup Guide

Step-by-step guide to configure your Supabase backend for the Student Council application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Supabase project created

---

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in sidebar)
3. Navigate to **API** section
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the long string under "Project API keys")

---

## Step 2: Configure Environment Variables

1. Open the `.env` file in your project root (or create it if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. **Restart your dev server** for changes to take effect

---

## Step 3: Create Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the sidebar
2. Click **New Query**
3. Open the `supabase_setup.sql` file from your project
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for the success message

**What this creates:**
- ✅ `concerns` table
- ✅ `concern_timeline` table
- ✅ `admin_users` table
- ✅ `concern_assignments` table
- ✅ Automatic triggers for timeline tracking
- ✅ Row Level Security policies

---

## Step 4: Create Storage Bucket

1. In Supabase dashboard, click on **Storage** in the sidebar
2. Click **New bucket**
3. Configure the bucket:
   - **Name:** `evidence`
   - **Public bucket:** ✅ **YES** (check this box)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg, image/png`
4. Click **Create bucket**

### Set Storage Policies

After creating the bucket:

1. Click on the `evidence` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Create two policies:

**Policy 1: Allow Public Uploads**
```sql
CREATE POLICY "Anyone can upload evidence"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'evidence');
```

**Policy 2: Allow Public Reads**
```sql
CREATE POLICY "Anyone can read evidence"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidence');
```

---

## Step 5: Create Admin User (Optional)

To test the admin dashboard, you need to create an admin user:

### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. Copy the user's UUID

### Option B: Via SQL

1. Go to **SQL Editor**
2. Run this query (replace with your values):

```sql
-- First, create the auth user via dashboard, then run this:
INSERT INTO admin_users (id, full_name, role, email) 
VALUES (
    'YOUR-USER-UUID-HERE',  -- Get this from Authentication → Users
    'John Doe',
    'ssc',  -- Options: 'ssc', 'usc', 'faculty'
    'john.doe@university.edu'
);
```

---

## Step 6: Verify Setup

Run these verification queries in the SQL Editor:

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');
```

Expected result: 4 rows

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');
```

Expected result: All should have `rowsecurity = true`

### Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'evidence';
```

Expected result: 1 row with `public = true`

---

## Step 7: Test the Connection

1. Make sure your `.env` file has the correct credentials
2. Restart your dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```
3. Open the browser console (F12)
4. Check for any Supabase connection errors
5. If no errors, you're good to go! ✅

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists in project root
- Verify variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after changing `.env`

### "relation does not exist" errors
- Make sure you ran the entire `supabase_setup.sql` script
- Check the SQL Editor for any error messages
- Verify tables exist in **Database** → **Tables**

### Storage upload fails
- Verify `evidence` bucket is marked as **public**
- Check storage policies are created
- Ensure file size is under 10MB

### Authentication issues
- Make sure admin user exists in `admin_users` table
- Verify the UUID matches the auth.users UUID
- Check RLS policies are enabled

---

## Next Steps

After completing this setup:

1. ✅ Test concern submission (should save to database)
2. ✅ Test concern tracking (should fetch real data)
3. ✅ Test admin login (if admin user created)
4. ✅ Test admin dashboard (should show real concerns)

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs: **Logs** → **Postgres Logs**
2. Verify RLS policies: **Database** → **Policies**
3. Check storage policies: **Storage** → **evidence** → **Policies**
