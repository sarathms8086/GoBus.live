import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Verify a ticket by QR code or ticket ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Ticket code required', valid: false }, { status: 400 });
        }

        console.log('[API] Verifying ticket:', code);

        const supabase = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseAnonKey);

        // Try to find ticket by QR code or by ID
        let ticket = null;

        // First try QR code exact match
        const { data: qrMatch } = await supabase
            .from('tickets')
            .select('*')
            .eq('qr_code', code)
            .maybeSingle();

        if (qrMatch) {
            ticket = qrMatch;
        } else {
            // Try partial match on QR code (last digits)
            const { data: partialMatch } = await supabase
                .from('tickets')
                .select('*')
                .ilike('qr_code', `%${code}`)
                .maybeSingle();

            ticket = partialMatch;
        }

        if (!ticket) {
            console.log('[API] Ticket not found:', code);
            return NextResponse.json({
                valid: false,
                error: 'Ticket not found'
            });
        }

        // Check ticket status
        if (ticket.status === 'Used') {
            console.log('[API] Ticket already used:', code);
            return NextResponse.json({
                valid: false,
                error: 'Ticket already used',
                ticket: {
                    from_stop: ticket.from_stop,
                    to_stop: ticket.to_stop,
                    passengers: ticket.passengers,
                }
            });
        }

        if (ticket.status === 'Expired') {
            console.log('[API] Ticket expired:', code);
            return NextResponse.json({
                valid: false,
                error: 'Ticket expired',
                ticket: {
                    from_stop: ticket.from_stop,
                    to_stop: ticket.to_stop,
                    passengers: ticket.passengers,
                }
            });
        }

        // Mark ticket as used
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ status: 'Used', updated_at: new Date().toISOString() })
            .eq('id', ticket.id);

        if (updateError) {
            console.error('[API] Error updating ticket:', updateError);
        }

        console.log('[API] Ticket validated successfully:', code);
        return NextResponse.json({
            valid: true,
            ticket: {
                id: ticket.id,
                from_stop: ticket.from_stop,
                to_stop: ticket.to_stop,
                passengers: ticket.passengers,
                route_name: ticket.route_name,
                amount: ticket.amount,
            }
        });

    } catch (error: any) {
        console.error('[API] Ticket verify error:', error);
        return NextResponse.json({
            valid: false,
            error: error.message
        }, { status: 500 });
    }
}
