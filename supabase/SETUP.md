# Supabase Backend Setup Guide

This guide walks you through setting up Supabase as the backend for GO BUS.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Fill in:
   - **Project name**: `gobus` (or your preferred name)
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose the closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (1-2 minutes)

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Run each migration file in order:

### Migration 1: Initial Schema
Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` and click "Run"

### Migration 2: Row Level Security
Copy and paste the contents of `supabase/migrations/002_row_level_security.sql` and click "Run"

### Migration 3: Auth Trigger
Copy and paste the contents of `supabase/migrations/003_auth_trigger.sql` and click "Run"

## Step 5: Verify Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `profiles`
   - `owner_profiles`
   - `driver_profiles`
   - `buses`
   - `bus_stops`
   - `tickets`

## Step 6: Configure Authentication

1. Go to **Authentication > Providers** in Supabase
2. Ensure "Email" is enabled
3. Go to **Authentication > Settings**
4. Under "Site URL", add your app URL:
   - Development: `http://localhost:3000`
   - Production: Your deployed URL
5. (Optional) Disable email confirmation for testing:
   - Go to **Authentication > Settings**
   - Toggle off "Enable email confirmations"

## Step 7: Test the App

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Try signing up as:
   - **Customer**: Use the customer signup flow
   - **Owner**: Use the owner signup flow

## Project Structure

```
go_bus/
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   ├── auth-context.tsx      # Customer auth context
│   ├── owner-auth-context.tsx # Owner auth context
│   ├── driver-auth-context.tsx # Driver auth context
│   └── api/
│       ├── buses.ts          # Bus CRUD operations
│       ├── drivers.ts        # Driver CRUD operations
│       └── tickets.ts        # Ticket operations
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_row_level_security.sql
│       └── 003_auth_trigger.sql
└── .env.local.example        # Environment variables template
```

## Security Notes

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- Owners can only manage their own buses and drivers
- Drivers can only validate tickets for their assigned bus

## Troubleshooting

### "Invalid API key" error
- Check that `.env.local` has the correct Supabase URL and anon key
- Restart the dev server after changing environment variables

### Tables not found
- Make sure you ran all 3 migration files in order
- Check for errors in the SQL Editor output

### Auth not working
- Verify email provider is enabled in Supabase
- Check Site URL is set correctly
- Look at browser console for detailed errors

## Next Steps

After setup is complete:
1. Update frontend components to use Supabase APIs
2. Test all user flows (customer, owner, driver)
3. Deploy to production (Vercel recommended)
