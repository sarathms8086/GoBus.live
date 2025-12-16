-- ============================================
-- GO BUS - Driver Slots Migration (Simplified)
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the foreign key constraint to profiles table if it exists
-- This allows drivers to exist without auth.users entry
ALTER TABLE public.driver_profiles 
DROP CONSTRAINT IF EXISTS driver_profiles_id_fkey;

-- Add slot_name column (e.g., "Driver A", "Driver B")
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS slot_name TEXT;

-- Add remarks column for owner notes
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Add password column for simple authentication (hashed)
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add created_at for ordering
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Make id column auto-generate UUIDs (no longer tied to auth.users)
ALTER TABLE public.driver_profiles 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Make name nullable (slot_name replaces it)
ALTER TABLE public.driver_profiles 
ALTER COLUMN name DROP NOT NULL;

-- Drop the old primary key constraint referencing profiles
-- and recreate as standalone
DO $$
BEGIN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'driver_profiles' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%profiles%'
    ) THEN
        -- Already handled above
        NULL;
    END IF;
END $$;

-- Update existing records to have a slot_name based on their creation order
DO $$
DECLARE
    owner_rec RECORD;
    driver_rec RECORD;
    slot_counter INTEGER;
    slot_letter TEXT;
BEGIN
    FOR owner_rec IN SELECT DISTINCT owner_id FROM public.driver_profiles LOOP
        slot_counter := 0;
        FOR driver_rec IN 
            SELECT id FROM public.driver_profiles 
            WHERE owner_id = owner_rec.owner_id 
            ORDER BY created_at NULLS FIRST, id
        LOOP
            slot_letter := CHR(65 + slot_counter);
            UPDATE public.driver_profiles 
            SET slot_name = 'Driver ' || slot_letter
            WHERE id = driver_rec.id AND slot_name IS NULL;
            slot_counter := slot_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Set defaults for new records
ALTER TABLE public.driver_profiles 
ALTER COLUMN slot_name SET DEFAULT 'Driver A';

-- Update RLS policy to allow owners to insert drivers with any id (not just their own)
DROP POLICY IF EXISTS "Owners can create drivers" ON public.driver_profiles;

CREATE POLICY "Owners can create drivers"
    ON public.driver_profiles FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());
