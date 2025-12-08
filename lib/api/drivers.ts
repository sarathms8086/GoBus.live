import { supabase, DriverProfile, DriverWithBus } from '@/lib/supabase';

export const driverApi = {
    /**
     * Get all drivers for an owner
     */
    async getByOwner(ownerId: string): Promise<DriverWithBus[]> {
        const { data, error } = await supabase
            .from('driver_profiles')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as DriverWithBus[];
    },

    /**
     * Get a driver by ID
     */
    async getById(driverId: string): Promise<DriverWithBus | null> {
        const { data, error } = await supabase
            .from('driver_profiles')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('id', driverId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as DriverWithBus;
    },

    /**
     * Get current driver's profile (for driver dashboard)
     */
    async getCurrentDriver(): Promise<DriverWithBus | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        return this.getById(user.id);
    },

    /**
     * Create a new driver
     * Note: This creates both the auth user and driver profile
     * Owners create drivers, so we use the supabase admin API via edge function
     * For now, we'll use the regular signup and then update the profile
     */
    async create(
        ownerId: string,
        driverData: {
            email: string;
            password: string;
            name: string;
            phone: string;
            busId?: string;
        }
    ): Promise<{ driver: DriverProfile; email: string; password: string }> {
        // Generate a unique username
        const username = `driver_${ownerId.slice(-4)}_${Date.now().toString().slice(-3)}`;

        // Create auth user with driver role
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: driverData.email,
            password: driverData.password,
            options: {
                data: {
                    role: 'driver',
                    display_name: driverData.name,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create driver account');

        // The profile is created automatically by the trigger
        // Now we need to create the driver_profile
        const { data, error } = await supabase
            .from('driver_profiles')
            .insert({
                id: authData.user.id,
                owner_id: ownerId,
                bus_id: driverData.busId || null,
                username,
                name: driverData.name,
                phone: driverData.phone,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            driver: data as DriverProfile,
            email: driverData.email,
            password: driverData.password,
        };
    },

    /**
     * Update a driver's profile
     */
    async update(id: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
        const { data, error } = await supabase
            .from('driver_profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as DriverProfile;
    },

    /**
     * Assign a driver to a bus
     */
    async assignToBus(driverId: string, busId: string | null): Promise<DriverProfile> {
        return this.update(driverId, { bus_id: busId });
    },

    /**
     * Delete a driver
     * Note: This only removes the driver_profile. The auth user remains.
     * For full deletion, use admin/service role
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('driver_profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get drivers assigned to a specific bus
     */
    async getByBus(busId: string): Promise<DriverProfile[]> {
        const { data, error } = await supabase
            .from('driver_profiles')
            .select('*')
            .eq('bus_id', busId);

        if (error) throw error;
        return (data || []) as DriverProfile[];
    },
};
