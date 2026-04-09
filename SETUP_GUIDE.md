# Colugee Setup Guide

## New Supabase Project Setup

1. Go to https://supabase.com → New Project
2. Copy your **Project URL** and **anon public key**

## Add .env files to each app

Create `.env` file in each folder with your new keys:

### student-app/.env
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### teacher-app/.env
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### admin-panel/.env
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### colugee-phone/student-phone-app/.env
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Run each app locally

```bash
# Student App (port 5173)
cd student-app && npm install && npm run dev

# Teacher App (port 5174)
cd teacher-app && npm install && npm run dev

# Admin Panel (port 5175)
cd admin-panel && npm install && npm run dev

# Phone App (port 5176)
cd colugee-phone/student-phone-app && npm install && npm run dev
```

## Seed Demo Data in Supabase

Run this SQL in Supabase SQL Editor to add a demo institution:

```sql
INSERT INTO institutions (name, code, address, contact_email)
VALUES ('Demo College', 'DEMO', 'Demo City, India', 'admin@demo.edu');
```

Then create a user via Supabase Auth → Users → Add User
and manually insert their profile:

```sql
INSERT INTO profiles (user_id, full_name, email, role, department, institution_id, institution_roll_number)
SELECT 
  auth.users.id,
  'Admin User',
  'admin@demo.edu',
  'authority',
  'Administration',
  institutions.id,
  'ADMIN001'
FROM auth.users, institutions
WHERE auth.users.email = 'admin@demo.edu'
AND institutions.code = 'DEMO';
```

## Vercel Deployment (Last Step)

Deploy each app as a separate Vercel project:
- student-app → colugee-student.vercel.app
- teacher-app → colugee-teacher.vercel.app  
- admin-panel → colugee-admin.vercel.app
- colugee-phone/student-phone-app → colugee-phone.vercel.app

Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as Environment Variables in each Vercel project.
