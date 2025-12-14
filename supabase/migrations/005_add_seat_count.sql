-- ============================================
-- GO BUS - Add Seat Count to Buses
-- Run this in Supabase SQL Editor
-- ============================================

-- Add total_seats column (how many seats the bus has)
ALTER TABLE public.buses 
ADD COLUMN IF NOT EXISTS total_seats INTEGER NOT NULL DEFAULT 40;

-- Add current_passengers column (for live occupancy tracking)
ALTER TABLE public.buses 
ADD COLUMN IF NOT EXISTS current_passengers INTEGER NOT NULL DEFAULT 0;

-- Add constraint to ensure current_passengers doesn't exceed total_seats
ALTER TABLE public.buses
ADD CONSTRAINT check_passengers_within_capacity 
CHECK (current_passengers >= 0 AND current_passengers <= total_seats);
