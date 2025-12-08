-- ============================================
-- GO BUS - Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'owner', 'driver')),
    display_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OWNER PROFILES TABLE
-- ============================================
CREATE TABLE public.owner_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT
);

-- ============================================
-- BUSES TABLE
-- ============================================
CREATE TABLE public.buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
    registration_number TEXT UNIQUE NOT NULL,
    ref_number TEXT UNIQUE NOT NULL,
    route_from TEXT NOT NULL,
    route_to TEXT NOT NULL,
    current_lat FLOAT,
    current_lng FLOAT,
    current_stop TEXT,
    occupancy TEXT DEFAULT 'Low' CHECK (occupancy IN ('Low', 'Medium', 'High', 'Full')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVER PROFILES TABLE
-- ============================================
CREATE TABLE public.driver_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT
);

-- ============================================
-- BUS STOPS TABLE
-- ============================================
CREATE TABLE public.bus_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    UNIQUE(bus_id, sequence)
);

-- ============================================
-- TICKETS TABLE
-- ============================================
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
    bus_code TEXT NOT NULL,
    route_name TEXT NOT NULL,
    from_stop TEXT NOT NULL,
    to_stop TEXT NOT NULL,
    passengers INTEGER NOT NULL DEFAULT 1,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Used', 'Expired')),
    qr_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_buses_owner ON public.buses(owner_id);
CREATE INDEX idx_driver_profiles_owner ON public.driver_profiles(owner_id);
CREATE INDEX idx_driver_profiles_bus ON public.driver_profiles(bus_id);
CREATE INDEX idx_bus_stops_bus ON public.bus_stops(bus_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_tickets_bus ON public.tickets(bus_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER buses_updated_at
    BEFORE UPDATE ON public.buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
