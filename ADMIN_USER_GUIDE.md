# Creating Your First Admin User

To log in to the Admin Portal, you need to create an admin user in two places in your Supabase Dashboard.

## Step 1: Create the User in Supabase Auth

1. **Go to Authentication:**
   https://supabase.com/dashboard/project/tzwzhabmjordmxgmhvet/auth/users

2. **Add User:**
   - Click **Add User** -> **Create new user**.
   - Enter an **Email** and **Password**.
   - **Uncheck** "Send invite email" (to create the user immediately).
   - Click **Create User**.

3. **Copy the User ID:**
   - Find your new user in the list.
   - Copy the **User ID** (it looks like a long string of letters and numbers, e.g., `550e8400-e29b...`).

---

## Step 2: Add the User to the `admin_users` Table

1. **Go to Table Editor:**
   https://supabase.com/dashboard/project/tzwzhabmjordmxgmhvet/editor

2. **Select `admin_users` table.**

3. **Insert Row:**
   - Click **Insert row**.
   - **id:** Paste the **User ID** you copied from Step 1.
   - **full_name:** Enter your name (e.g., "Admin User").
   - **role:** Select one (e.g., `ssc`).
   - **email:** Enter the same email you used in Step 1.
   - Click **Save**.

---

## 🚀 You're Ready!

Now you can go to your app and log in!

- **Login Page:** http://localhost:8080/admin
- Use the **Email** and **Password** you just created.

**What happens next?**
- After logging in, you'll be redirected to the dashboard.
- The dashboard will automatically fetch your role (SSC, USC, or Faculty) and show you the right concerns.
