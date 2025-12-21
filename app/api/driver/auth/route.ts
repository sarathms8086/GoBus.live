import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Only create admin client if service role key is available
const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

// Fallback to anon key if no service role key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

function encodePassword(password: string): string {
    return Buffer.from(password).toString('base64');
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        console.log('[API] Authenticating driver:', username);

        // Use admin client if available (bypasses RLS), otherwise use anon
        const client = supabaseAdmin || supabaseAnon;
        const clientType = supabaseAdmin ? 'admin' : 'anon';
        console.log(`[API] Using ${clientType} client`);

        const { data: driver, error } = await client
            .from('driver_profiles')
            .select(`
                *,
                bus:buses(*)
            `)
            .ilike('username', username.trim())
            .maybeSingle();

        if (error) {
            console.error('[API] Database error:', error.message);
            return NextResponse.json(
                { error: 'Database error: ' + error.message },
                { status: 500 }
            );
        }

        if (!driver) {
            console.log('[API] Driver not found:', username);
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        console.log('[API] Driver found:', driver.slot_name);

        // Verify password
        if (driver.password_hash) {
            const encodedInput = encodePassword(password.trim());

            // Check base64 encoded password
            if (driver.password_hash === encodedInput) {
                console.log('[API] Password verified (encoded)');
                return NextResponse.json({ driver });
            }

            // Check plain text password
            if (driver.password_hash === password.trim()) {
                console.log('[API] Password verified (plain)');
                return NextResponse.json({ driver });
            }

            console.log('[API] Password mismatch');
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Account has no password set' },
            { status: 401 }
        );

    } catch (error: any) {
        console.error('[API] Auth error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}
