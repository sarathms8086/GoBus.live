import { supabase, DriverProfile, DriverWithBus } from '@/lib/supabase';

/**
 * Generate the next slot name for an owner (Driver A, B, C, etc.)
 */
async function getNextSlotName(ownerId: string): Promise<string> {
    const { data: existingDrivers } = await supabase
        .from('driver_profiles')
        .select('slot_name')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

    if (!existingDrivers || existingDrivers.length === 0) {
        return 'Driver A';
    }

    // Find the highest slot letter used
    const usedLetters = existingDrivers.map(d => {
        const match = d.slot_name.match(/Driver ([A-Z])/);
        return match ? match[1].charCodeAt(0) - 65 : -1;
    }).filter(n => n >= 0);

    const maxIndex = Math.max(...usedLetters);
    const nextLetter = String.fromCharCode(65 + maxIndex + 1);
    return `Driver ${nextLetter}`;
}

/**
 * Generate a simple password for drivers
 */
function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

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
            .order('created_at', { ascending: true });

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
     * Create a new driver slot
     * Auto-generates slot name, username, and password
     */
    async create(
        ownerId: string,
        driverData: {
            busId?: string;
            remarks?: string;
        }
    ): Promise<{ driver: DriverProfile; username: string; password: string }> {
        // Get next slot name
        const slotName = await getNextSlotName(ownerId);
        const slotLetter = slotName.replace('Driver ', '').toLowerCase();

        // Generate username and password
        const username = `slot_${slotLetter}_${ownerId.slice(-4)}_${Date.now().toString().slice(-3)}`;
        const password = generatePassword();

        // Generate email for auth (internal use only)
        const email = `${username}@driver.gobus.local`;

        // Create auth user with driver role
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'driver',
                    display_name: slotName,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create driver account');

        // Create driver profile
        const { data, error } = await supabase
            .from('driver_profiles')
            .insert({
                id: authData.user.id,
                owner_id: ownerId,
                bus_id: driverData.busId || null,
                username,
                slot_name: slotName,
                name: null,
                phone: null,
                remarks: driverData.remarks || null,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            driver: data as DriverProfile,
            username,
            password,
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
     * Update driver remarks
     */
    async updateRemarks(id: string, remarks: string): Promise<DriverProfile> {
        return this.update(id, { remarks });
    },

    /**
     * Assign a driver to a bus
     */
    async assignToBus(driverId: string, busId: string | null): Promise<DriverProfile> {
        return this.update(driverId, { bus_id: busId });
    },

    /**
     * Delete a driver
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

    /**
     * Get the next available slot name for preview
     */
    async getNextSlotName(ownerId: string): Promise<string> {
        return getNextSlotName(ownerId);
    },
};
