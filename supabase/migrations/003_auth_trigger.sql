-- ============================================
-- GO BUS - Auth Trigger for Auto Profile Creation
-- Run this in Supabase SQL Editor AFTER 002_row_level_security.sql
-- ============================================

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role from metadata, default to 'customer'
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, role, display_name, phone)
    VALUES (
        NEW.id,
        user_role,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.phone
    );
    
    -- If role is owner, also create owner_profile
    IF user_role = 'owner' THEN
        INSERT INTO public.owner_profiles (id, company_name, email, phone)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
            NEW.email,
            NEW.phone
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the signup
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTION: Generate Bus Reference Number
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_bus_ref_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ref_number IS NULL OR NEW.ref_number = '' THEN
        NEW.ref_number := 'BUS' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || floor(random() * 1000)::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to buses table
DROP TRIGGER IF EXISTS generate_bus_ref ON public.buses;
CREATE TRIGGER generate_bus_ref
    BEFORE INSERT ON public.buses
    FOR EACH ROW EXECUTE FUNCTION public.generate_bus_ref_number();
