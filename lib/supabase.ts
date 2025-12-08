import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Database Types
// ============================================

export interface Profile {
    id: string;
    role: 'customer' | 'owner' | 'driver';
    display_name: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
}

export interface OwnerProfile {
    id: string;
    company_name: string;
    email: string | null;
    phone: string | null;
}

export interface DriverProfile {
    id: string;
    owner_id: string;
    bus_id: string | null;
    username: string;
    name: string;
    phone: string | null;
}

export interface Bus {
    id: string;
    owner_id: string;
    registration_number: string;
    ref_number: string;
    route_from: string;
    route_to: string;
    current_lat: number | null;
    current_lng: number | null;
    current_stop: string | null;
    occupancy: 'Low' | 'Medium' | 'High' | 'Full';
    created_at: string;
    updated_at: string;
    stops?: BusStop[];
}

export interface BusStop {
    id: string;
    bus_id: string;
    name: string;
    arrival_time: string;
    sequence: number;
}

export interface Ticket {
    id: string;
    user_id: string;
    bus_id: string;
    bus_code: string;
    route_name: string;
    from_stop: string;
    to_stop: string;
    passengers: number;
    amount: number;
    status: 'Active' | 'Used' | 'Expired';
    qr_code: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// Database Types with Relations (for queries with joins)
// ============================================

export interface BusWithStops extends Bus {
    stops: BusStop[];
}

export interface DriverWithBus extends DriverProfile {
    bus?: Bus;
}

export interface TicketWithBus extends Ticket {
    bus?: Bus;
}
