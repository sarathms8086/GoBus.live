import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const results: any = {
        timestamp: new Date().toISOString(),
        env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        },
        tests: {}
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        results.error = 'Missing environment variables';
        return NextResponse.json(results, { status: 500 });
    }

    // Test 1: Basic fetch to Supabase
    try {
        const start = Date.now();
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseAnonKey,
            },
            signal: AbortSignal.timeout(10000),
        });
        results.tests.basicFetch = {
            success: true,
            status: response.status,
            timeMs: Date.now() - start,
        };
    } catch (error: any) {
        results.tests.basicFetch = {
            success: false,
            error: error.message,
        };
    }

    // Test 2: Create Supabase client and test simple query
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const start = Date.now();

        // Simple health check query with timeout
        const queryPromise = supabase.from('profiles').select('id').limit(1);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 10000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        results.tests.supabaseQuery = {
            success: !error,
            error: error?.message,
            timeMs: Date.now() - start,
            dataReceived: !!data,
        };
    } catch (error: any) {
        results.tests.supabaseQuery = {
            success: false,
            error: error.message,
        };
    }

    // Test 3: Test Auth endpoint directly
    try {
        const start = Date.now();
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: {
                'apikey': supabaseAnonKey,
            },
            signal: AbortSignal.timeout(10000),
        });
        const data = await response.text();
        results.tests.authHealth = {
            success: response.ok,
            status: response.status,
            timeMs: Date.now() - start,
            response: data.substring(0, 100),
        };
    } catch (error: any) {
        results.tests.authHealth = {
            success: false,
            error: error.message,
        };
    }

    return NextResponse.json(results);
}
