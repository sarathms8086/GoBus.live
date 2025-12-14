-- ============================================
-- GO BUS - Bank Account Management
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- BANK ACCOUNTS TABLE
-- Stores owner's beneficiary bank accounts
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,           -- Beneficiary name
    account_number TEXT NOT NULL,         -- Account number
    ifsc_code TEXT NOT NULL,              -- IFSC code
    bank_name TEXT NOT NULL,              -- Bank name
    is_default BOOLEAN DEFAULT false,     -- Default account for new buses
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner ON public.bank_accounts(owner_id);

-- Add bank_account_id to buses table for assignment
ALTER TABLE public.buses 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Owners can only see their own bank accounts
CREATE POLICY "Owners can view own bank accounts"
    ON public.bank_accounts FOR SELECT
    USING (auth.uid() = owner_id);

-- Owners can insert their own bank accounts
CREATE POLICY "Owners can insert own bank accounts"
    ON public.bank_accounts FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own bank accounts
CREATE POLICY "Owners can update own bank accounts"
    ON public.bank_accounts FOR UPDATE
    USING (auth.uid() = owner_id);

-- Owners can delete their own bank accounts
CREATE POLICY "Owners can delete own bank accounts"
    ON public.bank_accounts FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================
-- TRIGGER: Ensure only one default account per owner
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_default_account()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.bank_accounts
        SET is_default = false
        WHERE owner_id = NEW.owner_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bank_accounts_default_trigger
    AFTER INSERT OR UPDATE ON public.bank_accounts
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_account();
