-- ============================================
-- GO BUS - Add Ticket Type and Daily Pass Support
-- Run this in Supabase SQL Editor
-- ============================================

-- Add ticket_type to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'normal' CHECK (ticket_type IN ('normal', 'daily_pass'));

-- Add validated_at timestamp for when ticket was validated
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- Add validated_by to track which driver validated
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.driver_profiles(id) ON DELETE SET NULL;

-- ============================================
-- DAILY PASSES TABLE
-- For customers who purchase daily passes
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
    pass_number TEXT UNIQUE NOT NULL,          -- e.g., "DP240001"
    customer_name TEXT NOT NULL,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY PASS VALIDATIONS TABLE
-- Track each time a daily pass is validated
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_pass_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_pass_id UUID NOT NULL REFERENCES public.daily_passes(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    validated_by UUID REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_passes_user ON public.daily_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_passes_bus ON public.daily_passes(bus_id);
CREATE INDEX IF NOT EXISTS idx_daily_passes_status ON public.daily_passes(status);
CREATE INDEX IF NOT EXISTS idx_daily_pass_validations_pass ON public.daily_pass_validations(daily_pass_id);
CREATE INDEX IF NOT EXISTS idx_daily_pass_validations_trip ON public.daily_pass_validations(trip_id);
CREATE INDEX IF NOT EXISTS idx_tickets_validated_at ON public.tickets(validated_at);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER daily_passes_updated_at
    BEFORE UPDATE ON public.daily_passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.daily_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pass_validations ENABLE ROW LEVEL SECURITY;

-- Daily passes policies
CREATE POLICY "Users can view own daily passes" ON public.daily_passes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create daily passes" ON public.daily_passes
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow service role and drivers to view daily passes for validation
CREATE POLICY "Drivers can view bus daily passes" ON public.daily_passes
    FOR SELECT USING (true);

-- Daily pass validations policies
CREATE POLICY "Anyone can view validations" ON public.daily_pass_validations
    FOR SELECT USING (true);

CREATE POLICY "Drivers can create validations" ON public.daily_pass_validations
    FOR INSERT WITH CHECK (true);
