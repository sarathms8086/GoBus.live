import { supabase, Ticket, TicketWithBus } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const ticketApi = {
    /**
     * Get current user's tickets
     */
    async getMyTickets(): Promise<TicketWithBus[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as TicketWithBus[];
    },

    /**
     * Get a ticket by ID
     */
    async getById(ticketId: string): Promise<TicketWithBus | null> {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('id', ticketId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as TicketWithBus;
    },

    /**
     * Get a ticket by QR code (for validation)
     */
    async getByQrCode(qrCode: string): Promise<TicketWithBus | null> {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('qr_code', qrCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as TicketWithBus;
    },

    /**
     * Book a new ticket
     */
    async book(ticket: {
        bus_id: string;
        bus_code: string;
        route_name: string;
        from_stop: string;
        to_stop: string;
        passengers: number;
        amount: number;
    }): Promise<Ticket> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const qr_code = `GOBUS-${uuidv4()}`;

        const { data, error } = await supabase
            .from('tickets')
            .insert({
                ...ticket,
                user_id: user.id,
                qr_code,
                status: 'Active',
            })
            .select()
            .single();

        if (error) throw error;
        return data as Ticket;
    },

    /**
     * Validate a ticket (mark as used) - Driver action
     */
    async validate(ticketId: string): Promise<Ticket> {
        const { data, error } = await supabase
            .from('tickets')
            .update({ status: 'Used' })
            .eq('id', ticketId)
            .eq('status', 'Active') // Only validate active tickets
            .select()
            .single();

        if (error) throw error;
        return data as Ticket;
    },

    /**
     * Validate a ticket by QR code - Driver action
     */
    async validateByQrCode(qrCode: string): Promise<Ticket> {
        const ticket = await this.getByQrCode(qrCode);
        if (!ticket) throw new Error('Ticket not found');
        if (ticket.status !== 'Active') throw new Error('Ticket is not active');

        return this.validate(ticket.id);
    },

    /**
     * Get tickets for a bus (driver view)
     */
    async getByBus(busId: string): Promise<Ticket[]> {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('bus_id', busId)
            .eq('status', 'Active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Ticket[];
    },

    /**
     * Cancel a ticket (user action)
     */
    async cancel(ticketId: string): Promise<Ticket> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tickets')
            .update({ status: 'Expired' })
            .eq('id', ticketId)
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .select()
            .single();

        if (error) throw error;
        return data as Ticket;
    },

    /**
     * Get ticket statistics (for analytics)
     */
    async getStats(userId: string): Promise<{
        total: number;
        active: number;
        used: number;
        expired: number;
    }> {
        const { data, error } = await supabase
            .from('tickets')
            .select('status')
            .eq('user_id', userId);

        if (error) throw error;

        const tickets = data || [];
        return {
            total: tickets.length,
            active: tickets.filter(t => t.status === 'Active').length,
            used: tickets.filter(t => t.status === 'Used').length,
            expired: tickets.filter(t => t.status === 'Expired').length,
        };
    },
};
