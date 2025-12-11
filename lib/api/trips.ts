import { supabase, Trip, TripStop, TripWithStops, DayOfWeek } from '@/lib/supabase';

export const tripApi = {
    /**
     * Get all trips for a bus with their stops
     */
    async getByBus(busId: string): Promise<TripWithStops[]> {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                stops:trip_stops(*)
            `)
            .eq('bus_id', busId)
            .order('trip_number', { ascending: true });

        if (error) throw error;

        // Sort stops by sequence
        return (data || []).map(trip => ({
            ...trip,
            stops: (trip.stops || []).sort((a: TripStop, b: TripStop) => a.sequence - b.sequence)
        })) as TripWithStops[];
    },

    /**
     * Get a single trip by ID with stops
     */
    async getById(tripId: string): Promise<TripWithStops | null> {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                stops:trip_stops(*)
            `)
            .eq('id', tripId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return {
            ...data,
            stops: (data.stops || []).sort((a: TripStop, b: TripStop) => a.sequence - b.sequence)
        } as TripWithStops;
    },

    /**
     * Create a new trip for a bus
     */
    async create(trip: {
        bus_id: string;
        trip_number: number;
        start_time: string;
        end_time?: string;
        days_of_week: DayOfWeek[];
    }): Promise<Trip> {
        const { data, error } = await supabase
            .from('trips')
            .insert(trip)
            .select()
            .single();

        if (error) throw error;
        return data as Trip;
    },

    /**
     * Update a trip
     */
    async update(tripId: string, updates: Partial<Trip>): Promise<Trip> {
        const { data, error } = await supabase
            .from('trips')
            .update(updates)
            .eq('id', tripId)
            .select()
            .single();

        if (error) throw error;
        return data as Trip;
    },

    /**
     * Delete a trip
     */
    async delete(tripId: string): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', tripId);

        if (error) throw error;
    },

    /**
     * Get next available trip number for a bus
     */
    async getNextTripNumber(busId: string): Promise<number> {
        const { data } = await supabase
            .from('trips')
            .select('trip_number')
            .eq('bus_id', busId)
            .order('trip_number', { ascending: false })
            .limit(1);

        return (data && data.length > 0) ? data[0].trip_number + 1 : 1;
    },

    /**
     * Add a stop to a trip
     */
    async addStop(tripId: string, stop: { name: string; arrival_time: string }): Promise<TripWithStops> {
        // Get current max sequence
        const { data: existingStops } = await supabase
            .from('trip_stops')
            .select('sequence')
            .eq('trip_id', tripId)
            .order('sequence', { ascending: false })
            .limit(1);

        const nextSequence = (existingStops && existingStops.length > 0)
            ? existingStops[0].sequence + 1
            : 1;

        const { error } = await supabase
            .from('trip_stops')
            .insert({
                trip_id: tripId,
                name: stop.name,
                arrival_time: stop.arrival_time,
                sequence: nextSequence,
            });

        if (error) throw error;

        return this.getById(tripId) as Promise<TripWithStops>;
    },

    /**
     * Delete a stop from a trip
     */
    async deleteStop(tripId: string, stopId: string): Promise<TripWithStops> {
        const { error } = await supabase
            .from('trip_stops')
            .delete()
            .eq('id', stopId);

        if (error) throw error;

        return this.getById(tripId) as Promise<TripWithStops>;
    },

    /**
     * Update stops order for a trip
     */
    async reorderStops(tripId: string, stopIds: string[]): Promise<TripWithStops> {
        // Update each stop's sequence
        for (let i = 0; i < stopIds.length; i++) {
            const { error } = await supabase
                .from('trip_stops')
                .update({ sequence: i + 1 })
                .eq('id', stopIds[i]);

            if (error) throw error;
        }

        return this.getById(tripId) as Promise<TripWithStops>;
    },
};
