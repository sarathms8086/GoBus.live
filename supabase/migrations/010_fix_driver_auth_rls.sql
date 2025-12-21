-- ============================================
-- GO BUS - Fix Driver Authentication RLS Policy
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow public access to driver_profiles for authentication
-- This is needed because drivers authenticate with username/password, not Supabase Auth
CREATE POLICY "Allow public read for driver authentication"
    ON public.driver_profiles FOR SELECT
    TO anon, authenticated
    USING (true);

-- Note: This allows reading all driver profiles, but password_hash is hashed
-- For better security, consider using a Supabase Edge Function with service_role key
