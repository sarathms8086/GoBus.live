import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to encode password
function encodePassword(password: string): string {
    return Buffer.from(password).toString('base64');
}

// Helper to generate password
function generateSimplePassword(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Extract registration suffix
function extractRegistrationSuffix(registrationNumber: string): string {
    const cleaned = registrationNumber.replace(/[^a-zA-Z0-9]/g, '');
    const digits = cleaned.replace(/[^0-9]/g, '');
    return digits.slice(-4) || '0000';
}

// Generate login ID
function generateLoginId(driverNumber: number, registrationSuffix: string): string {
    return `D${driverNumber}${registrationSuffix}`;
}

// GET - Fetch all drivers for owner
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Fetch drivers with bus info
        const { data: drivers, error: driversError } = await supabase
            .from('driver_profiles')
            .select(`*, bus:buses(*)`)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (driversError) {
            return NextResponse.json({ error: driversError.message }, { status: 500 });
        }

        // Fetch all buses for the dropdown
        const { data: buses } = await supabase
            .from('buses')
            .select('*')
            .eq('owner_id', user.id);

        return NextResponse.json({ drivers: drivers || [], buses: buses || [] });
    } catch (error: any) {
        console.error('[API] Drivers GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update a driver
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const { driverId, bus_id, remarks } = await request.json();

        if (!driverId) {
            return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('driver_profiles')
            .update({ bus_id: bus_id || null, remarks: remarks || null })
            .eq('id', driverId)
            .eq('owner_id', user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ driver: data });
    } catch (error: any) {
        console.error('[API] Driver PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create driver(s)
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const { action, count } = await request.json();

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const ownerId = user.id;

        // Get next driver number
        const { data: existingDrivers } = await supabase
            .from('driver_profiles')
            .select('slot_name')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(1);

        let startNumber = 1;
        if (existingDrivers && existingDrivers.length > 0) {
            const match = existingDrivers[0].slot_name?.match(/Driver (\d+)/);
            startNumber = match ? parseInt(match[1]) + 1 : 1;
        }

        // Get bus registration for login ID generation
        const { data: buses } = await supabase
            .from('buses')
            .select('registration_number')
            .eq('owner_id', ownerId)
            .limit(1);

        let registrationSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        if (buses && buses.length > 0 && buses[0].registration_number) {
            registrationSuffix = extractRegistrationSuffix(buses[0].registration_number);
        }

        const driversToCreate = count || 1;
        const credentials: { slotName: string; username: string; password: string }[] = [];
        const driversToInsert: any[] = [];

        for (let i = 0; i < driversToCreate; i++) {
            const driverNumber = startNumber + i;
            const slotName = `Driver ${driverNumber}`;
            const username = generateLoginId(driverNumber, registrationSuffix);
            const password = generateSimplePassword();

            credentials.push({ slotName, username, password });
            driversToInsert.push({
                owner_id: ownerId,
                bus_id: null,
                username,
                slot_name: slotName,
                name: null,
                phone: null,
                remarks: null,
                password_hash: encodePassword(password),
            });
        }

        const { data, error } = await supabase
            .from('driver_profiles')
            .insert(driversToInsert)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ drivers: data, credentials });
    } catch (error: any) {
        console.error('[API] Driver POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a driver
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const driverId = searchParams.get('id');
        const deleteLast = searchParams.get('last') === 'true';

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (deleteLast) {
            // Delete the last driver
            const { data: lastDriver } = await supabase
                .from('driver_profiles')
                .select('id')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (lastDriver && lastDriver.length > 0) {
                await supabase
                    .from('driver_profiles')
                    .delete()
                    .eq('id', lastDriver[0].id);
            }
        } else if (driverId) {
            await supabase
                .from('driver_profiles')
                .delete()
                .eq('id', driverId)
                .eq('owner_id', user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Driver DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
