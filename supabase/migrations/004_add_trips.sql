-- ============================================
-- GO BUS - Add Trips Support
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- TRIPS TABLE
-- Each bus can have multiple trips per day
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    trip_number INTEGER NOT NULL,                -- Trip 1, Trip 2, etc.
    start_time TEXT NOT NULL,                    -- e.g., "06:00"
    end_time TEXT,                               -- e.g., "08:30" (optional)
    days_of_week TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bus_id, trip_number)
);

-- ============================================
-- TRIP STOPS TABLE
-- Each trip has its own stops with times
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    UNIQUE(trip_id, sequence)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_bus ON public.trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON public.trip_stops(trip_id);

-- ============================================
-- UPDATE TICKETS TABLE (add trip reference)
-- ============================================
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY FOR TRIPS
-- ============================================
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Anyone can view active trips" ON public.trips
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their bus trips" ON public.trips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.buses
            WHERE buses.id = trips.bus_id
            AND buses.owner_id = auth.uid()
        )
    );

-- Trip stops policies
CREATE POLICY "Anyone can view trip stops" ON public.trip_stops
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage trip stops" ON public.trip_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips
            JOIN public.buses ON buses.id = trips.bus_id
            WHERE trips.id = trip_stops.trip_id
            AND buses.owner_id = auth.uid()
        )
    );
