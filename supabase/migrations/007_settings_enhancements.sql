-- ============================================
-- GO BUS - Settings Enhancements
-- Run this in Supabase SQL Editor
-- ============================================

-- Add address and notification_preferences to owner_profiles
ALTER TABLE public.owner_profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_alerts": true, "booking_notifications": true, "bus_status_updates": false}'::jsonb;

-- Ensure owners can update their own profiles
-- (Already covered by RLS in initial setup, but good to verify if policies exist)
-- If policy missing, one can be added:
-- CREATE POLICY "Owners can update own profile" ON public.owner_profiles FOR UPDATE USING (auth.uid() = id);
