-- ============================================
-- GO BUS - Driver Slots Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add slot_name column (e.g., "Driver A", "Driver B")
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS slot_name TEXT;

-- Add remarks column for owner notes (e.g., "Raju - until Dec 20")
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Add created_at for ordering
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Make name column nullable (slot_name replaces it as primary identifier)
ALTER TABLE public.driver_profiles 
ALTER COLUMN name DROP NOT NULL;

-- Update existing records to have a slot_name based on their creation order
DO $$
DECLARE
    owner_rec RECORD;
    driver_rec RECORD;
    slot_counter INTEGER;
    slot_letter TEXT;
BEGIN
    -- Loop through each owner
    FOR owner_rec IN SELECT DISTINCT owner_id FROM public.driver_profiles LOOP
        slot_counter := 0;
        -- Loop through each driver for this owner
        FOR driver_rec IN 
            SELECT id FROM public.driver_profiles 
            WHERE owner_id = owner_rec.owner_id 
            ORDER BY created_at NULLS FIRST, id
        LOOP
            slot_letter := CHR(65 + slot_counter); -- A, B, C, etc.
            UPDATE public.driver_profiles 
            SET slot_name = 'Driver ' || slot_letter
            WHERE id = driver_rec.id AND slot_name IS NULL;
            slot_counter := slot_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Now make slot_name NOT NULL after populating existing records
ALTER TABLE public.driver_profiles 
ALTER COLUMN slot_name SET NOT NULL;

-- Set default for new records
ALTER TABLE public.driver_profiles 
ALTER COLUMN slot_name SET DEFAULT 'Driver A';
