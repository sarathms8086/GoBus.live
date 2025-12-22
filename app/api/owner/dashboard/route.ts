import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    try {
        // Get access token from Authorization header
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token required' },
                { status: 401 }
            );
        }

        console.log('[API] Fetching dashboard data...');

        // Create Supabase client with user's access token
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });

        // Verify user and get their ID
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
            console.error('[API] User verification failed:', userError?.message);
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        console.log('[API] User verified:', user.id);

        // Fetch owner profile
        const { data: ownerProfile, error: ownerError } = await supabase
            .from('owner_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (ownerError) {
            console.error('[API] Owner profile error:', ownerError.message);

            // If PGRST116, owner profile doesn't exist - try to create it
            if (ownerError.code === 'PGRST116') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, display_name')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'owner') {
                    const { data: newOwner, error: createError } = await supabase
                        .from('owner_profiles')
                        .insert({
                            id: user.id,
                            company_name: profile.display_name || 'My Company',
                            email: user.email,
                        })
                        .select()
                        .single();

                    if (createError) {
                        return NextResponse.json(
                            { error: 'Failed to create owner profile' },
                            { status: 500 }
                        );
                    }

                    // Continue with newly created owner profile
                    console.log('[API] Created new owner profile');

                    // Fetch buses for this owner
                    const { data: buses, error: busesError } = await supabase
                        .from('buses')
                        .select(`
                            *,
                            stops:bus_stops(*),
                            trips(*)
                        `)
                        .eq('owner_id', user.id)
                        .order('created_at', { ascending: false });

                    return NextResponse.json({
                        owner: newOwner,
                        buses: buses || [],
                    });
                } else {
                    return NextResponse.json(
                        { error: 'No owner profile found' },
                        { status: 404 }
                    );
                }
            }

            return NextResponse.json(
                { error: ownerError.message },
                { status: 500 }
            );
        }

        // Fetch buses with stops and trips
        const { data: buses, error: busesError } = await supabase
            .from('buses')
            .select(`
                *,
                stops:bus_stops(*),
                trips(*)
            `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (busesError) {
            console.error('[API] Buses error:', busesError.message);
        }

        console.log('[API] Dashboard data fetched successfully');

        return NextResponse.json({
            owner: ownerProfile,
            buses: buses || [],
        });

    } catch (error: any) {
        console.error('[API] Dashboard error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
