import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Fetch driver dashboard data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const driverId = searchParams.get('driverId');

        if (!driverId) {
            return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
        }

        // Use service key for server-side access
        const supabase = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseAnonKey);

        console.log('[API] Fetching driver dashboard for:', driverId);

        // Fetch driver with bus info
        const { data: driver, error: driverError } = await supabase
            .from('driver_profiles')
            .select(`
                *,
                bus:buses(
                    id,
                    registration_number,
                    route_from,
                    route_to,
                    ref_number
                )
            `)
            .eq('id', driverId)
            .single();

        if (driverError) {
            console.error('[API] Driver fetch error:', driverError);
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Fetch trips for this bus if driver has a bus assigned
        let trips: any[] = [];
        if (driver.bus_id) {
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select(`
                    *,
                    stops:trip_stops(*)
                `)
                .eq('bus_id', driver.bus_id)
                .order('trip_number', { ascending: true });

            if (!tripsError && tripsData) {
                // Sort stops by sequence
                trips = tripsData.map(trip => ({
                    ...trip,
                    stops: (trip.stops || []).sort((a: any, b: any) => a.sequence - b.sequence)
                }));
            }
        }

        console.log('[API] Driver dashboard data fetched:', {
            driverId: driver.id,
            busAssigned: !!driver.bus,
            tripCount: trips.length
        });

        return NextResponse.json({
            driver: {
                id: driver.id,
                username: driver.username,
                slot_name: driver.slot_name,
                remarks: driver.remarks,
                name: driver.name,
                phone: driver.phone,
            },
            bus: driver.bus || null,
            trips: trips,
        });

    } catch (error: any) {
        console.error('[API] Driver dashboard error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
