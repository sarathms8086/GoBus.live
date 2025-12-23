import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { searchParams } = new URL(request.url);
        const tripId = searchParams.get('tripId');
        const busId = searchParams.get('busId');
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        if (!tripId && !busId) {
            return NextResponse.json({ error: 'tripId or busId is required' }, { status: 400 });
        }

        // Get tickets for this trip/bus validated today
        let ticketsQuery = supabase
            .from('tickets')
            .select('*')
            .eq('status', 'Used');

        if (tripId) {
            ticketsQuery = ticketsQuery.eq('trip_id', tripId);
        } else if (busId) {
            ticketsQuery = ticketsQuery.eq('bus_id', busId);
        }

        // Filter by date (validated_at or created_at)
        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;

        ticketsQuery = ticketsQuery
            .gte('updated_at', startOfDay)
            .lte('updated_at', endOfDay);

        const { data: tickets, error: ticketsError } = await ticketsQuery;

        if (ticketsError) {
            console.error('Error fetching tickets:', ticketsError);
            return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
        }

        // Get daily pass validations for today
        let dailyPassQuery = supabase
            .from('daily_pass_validations')
            .select(`
                *,
                daily_pass:daily_passes(
                    id,
                    pass_number,
                    customer_name,
                    valid_until,
                    user_id
                )
            `)
            .gte('validated_at', startOfDay)
            .lte('validated_at', endOfDay);

        if (tripId) {
            dailyPassQuery = dailyPassQuery.eq('trip_id', tripId);
        }

        const { data: dailyPassValidations, error: dailyPassError } = await dailyPassQuery;

        // Count normal tickets vs daily pass tickets
        const normalTickets = tickets?.filter(t => !t.ticket_type || t.ticket_type === 'normal') || [];
        const dailyPassTickets = tickets?.filter(t => t.ticket_type === 'daily_pass') || [];

        // Calculate totals
        const totalNormalTickets = normalTickets.length;
        const totalNormalPassengers = normalTickets.reduce((sum, t) => sum + (t.passengers || 1), 0);
        const totalDailyPassValidations = dailyPassValidations?.length || 0;
        const totalRevenue = normalTickets.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        // Format daily pass details
        const dailyPassDetails = dailyPassValidations?.map(v => ({
            id: v.id,
            passNumber: v.daily_pass?.pass_number,
            customerName: v.daily_pass?.customer_name,
            validUntil: v.daily_pass?.valid_until,
            validatedAt: v.validated_at,
        })) || [];

        return NextResponse.json({
            summary: {
                totalTickets: totalNormalTickets + totalDailyPassValidations,
                normalTickets: totalNormalTickets,
                normalPassengers: totalNormalPassengers,
                dailyPassValidations: totalDailyPassValidations,
                totalRevenue: totalRevenue.toFixed(2),
            },
            normalTicketDetails: normalTickets.map(t => ({
                id: t.id,
                passengers: t.passengers,
                fromStop: t.from_stop,
                toStop: t.to_stop,
                amount: t.amount,
                validatedAt: t.validated_at || t.updated_at,
            })),
            dailyPassDetails,
        });

    } catch (error: any) {
        console.error('Trip stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
