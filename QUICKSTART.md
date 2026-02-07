# 🚀 Supabase Backend Setup - Action Items

Your Supabase project is ready to configure! Follow these steps:

---

## ✅ Step 1: Environment Variables (DONE)
Your `.env` file is already configured with:
- Project URL: `https://tzwzhabmjordmxgmhvet.supabase.co`
- Anon Key: Configured ✅

---

## 📋 Step 2: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. **Open SQL Editor:**
   - Click here: https://supabase.com/dashboard/project/tzwzhabmjordmxgmhvet/sql/new

2. **Copy the SQL script:**
   - Open `supabase_setup.sql` in your project
   - Select all (Ctrl+A) and copy (Ctrl+C)

3. **Run the script:**
   - Paste into the Supabase SQL Editor
   - Click **Run** button (or Ctrl+Enter)
   - Wait for "Success" message

### What this creates:
- ✅ `concerns` table (stores student concerns)
- ✅ `concern_timeline` table (tracks status updates)
- ✅ `admin_users` table (stores admin information)
- ✅ `concern_assignments` table (links admins to concerns)
- ✅ Automatic triggers (auto-create timeline entries)
- ✅ Row Level Security policies (secure data access)

---

## 📦 Step 3: Create Storage Bucket

1. **Open Storage:**
   - Click here: https://supabase.com/dashboard/project/tzwzhabmjordmxgmhvet/storage/buckets

2. **Create new bucket:**
   - Click **"New bucket"** button
   - Name: `evidence`
   - **IMPORTANT:** Check ✅ **"Public bucket"**
   - Click **"Create bucket"**

3. **Set storage policies:**
   - Click on the `evidence` bucket
   - Go to **"Policies"** tab
   - Click **"New policy"** → **"For full customization"**
   
   **Add Policy 1 (Upload):**
   ```sql
   CREATE POLICY "Anyone can upload evidence"
   ON storage.objects FOR INSERT
   TO public
   WITH CHECK (bucket_id = 'evidence');
   ```
   
   **Add Policy 2 (Read):**
   ```sql
   CREATE POLICY "Anyone can read evidence"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'evidence');
   ```

---

## ✅ Step 4: Verify Setup

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('concerns', 'concern_timeline', 'admin_users', 'concern_assignments');
```

**Expected result:** Should return 4 rows

---

## 🧪 Step 5: Test the Application

After completing steps 2-4:

1. **Restart your dev server:**
   - Stop current server (Ctrl+C in terminal)
   - Run: `npm run dev`

2. **Test concern submission:**
   - Go to https://localhost:8080/submit-concern
   - Fill out the form
   - Capture a geotagged photo
   - Submit the concern
   - Check Supabase dashboard to see if data was saved

3. **Verify in Supabase:**
   - Go to: https://supabase.com/dashboard/project/tzwzhabmjordmxgmhvet/editor
   - Click on `concerns` table
   - You should see your submitted concern!

---

## 📝 Next Steps (After Basic Setup)

Once the database and storage are working:

1. **Replace mock data in TrackConcern** - Show real concern data
2. **Replace mock data in Admin Dashboard** - Show real concerns list
3. **Implement admin authentication** - Secure admin access
4. **Create admin users** - Add SSC/USC representatives

---

## ❓ Troubleshooting

**"relation does not exist" error:**
- Make sure you ran the entire `supabase_setup.sql` script
- Check for any errors in the SQL Editor output

**Storage upload fails:**
- Verify `evidence` bucket is marked as **public**
- Check that both storage policies were created

**Can't see data in app:**
- Restart dev server after database setup
- Check browser console for errors (F12)

---

## 🎯 Current Status

- [x] Environment variables configured
- [ ] Database schema created (Step 2)
- [ ] Storage bucket created (Step 3)
- [ ] Setup verified (Step 4)
- [ ] Application tested (Step 5)

**Ready to proceed? Start with Step 2!**
