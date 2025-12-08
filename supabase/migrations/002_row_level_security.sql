-- ============================================
-- GO BUS - Row Level Security Policies
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow insert during signup (handled by trigger, but needed for direct inserts)
CREATE POLICY "Enable insert for authenticated users"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- OWNER PROFILES POLICIES
-- ============================================
CREATE POLICY "Owners can view own profile"
    ON public.owner_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Owners can update own profile"
    ON public.owner_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
    ON public.owner_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- BUSES POLICIES
-- ============================================
-- Anyone authenticated can view buses (for customers searching)
CREATE POLICY "Anyone can view buses"
    ON public.buses FOR SELECT
    TO authenticated
    USING (true);

-- Owners can insert their own buses
CREATE POLICY "Owners can insert buses"
    ON public.buses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.owner_profiles
            WHERE id = auth.uid() AND id = owner_id
        )
    );

-- Owners can update their own buses
CREATE POLICY "Owners can update own buses"
    ON public.buses FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

-- Owners can delete their own buses
CREATE POLICY "Owners can delete own buses"
    ON public.buses FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- ============================================
-- DRIVER PROFILES POLICIES
-- ============================================
-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile"
    ON public.driver_profiles FOR SELECT
    USING (auth.uid() = id);

-- Owners can view their drivers
CREATE POLICY "Owners can view their drivers"
    ON public.driver_profiles FOR SELECT
    USING (owner_id = auth.uid());

-- Owners can create drivers (insert handled via service role in edge function)
CREATE POLICY "Owners can create drivers"
    ON public.driver_profiles FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Owners can update their drivers
CREATE POLICY "Owners can update their drivers"
    ON public.driver_profiles FOR UPDATE
    USING (owner_id = auth.uid());

-- Owners can delete their drivers
CREATE POLICY "Owners can delete their drivers"
    ON public.driver_profiles FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================
-- BUS STOPS POLICIES
-- ============================================
-- Anyone authenticated can view bus stops
CREATE POLICY "Anyone can view bus stops"
    ON public.bus_stops FOR SELECT
    TO authenticated
    USING (true);

-- Owners can insert stops for their buses
CREATE POLICY "Owners can insert bus stops"
    ON public.bus_stops FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.buses
            WHERE buses.id = bus_id
            AND buses.owner_id = auth.uid()
        )
    );

-- Owners can update stops for their buses
CREATE POLICY "Owners can update bus stops"
    ON public.bus_stops FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.buses
            WHERE buses.id = bus_stops.bus_id
            AND buses.owner_id = auth.uid()
        )
    );

-- Owners can delete stops from their buses
CREATE POLICY "Owners can delete bus stops"
    ON public.bus_stops FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.buses
            WHERE buses.id = bus_stops.bus_id
            AND buses.owner_id = auth.uid()
        )
    );

-- ============================================
-- TICKETS POLICIES
-- ============================================
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
    ON public.tickets FOR SELECT
    USING (user_id = auth.uid());

-- Users can create tickets for themselves
CREATE POLICY "Users can create tickets"
    ON public.tickets FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Drivers can view tickets for their assigned bus
CREATE POLICY "Drivers can view bus tickets"
    ON public.tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.driver_profiles
            WHERE driver_profiles.id = auth.uid()
            AND driver_profiles.bus_id = tickets.bus_id
        )
    );

-- Drivers can update (validate) tickets for their assigned bus
CREATE POLICY "Drivers can validate tickets"
    ON public.tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.driver_profiles
            WHERE driver_profiles.id = auth.uid()
            AND driver_profiles.bus_id = tickets.bus_id
        )
    );
