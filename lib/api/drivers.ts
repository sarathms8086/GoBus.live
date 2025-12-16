import { supabase, DriverProfile, DriverWithBus } from '@/lib/supabase';

/**
 * Generate login ID: D + driverNumber + 4 random digits
 * Example: D18285 for Driver 1
 */
function generateLoginId(driverNumber: number): string {
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    return `D${driverNumber}${digits}`;
}

/**
 * Generate 4-digit password like "1234"
 */
function generateSimplePassword(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Simple hash function for password
 */
function hashPassword(password: string): string {
    return btoa(password);
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
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
     * Authenticate a driver by username and password
     */
    async authenticate(username: string, password: string): Promise<DriverWithBus | null> {
        const { data, error } = await supabase
            .from('driver_profiles')
            .select(`
                *,
                bus:buses(*)
            `)
            .eq('username', username)
            .single();

        if (error || !data) return null;

        if (data.password_hash && verifyPassword(password, data.password_hash)) {
            return data as DriverWithBus;
        }
        return null;
    },

    /**
     * Get the next driver number for an owner
     */
    async getNextDriverNumber(ownerId: string): Promise<number> {
        const { data } = await supabase
            .from('driver_profiles')
            .select('slot_name')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!data || data.length === 0) return 1;

        // Extract number from "Driver 3" -> 3
        const match = data[0].slot_name?.match(/Driver (\d+)/);
        return match ? parseInt(match[1]) + 1 : 1;
    },

    /**
     * Create a single driver slot
     */
    async createOne(ownerId: string): Promise<{ driver: DriverProfile; username: string; password: string }> {
        const driverNumber = await this.getNextDriverNumber(ownerId);
        const slotName = `Driver ${driverNumber}`;
        const username = generateLoginId(driverNumber);
        const password = generateSimplePassword();

        const { data, error } = await supabase
            .from('driver_profiles')
            .insert({
                owner_id: ownerId,
                bus_id: null,
                username,
                slot_name: slotName,
                name: null,
                phone: null,
                remarks: null,
                password_hash: hashPassword(password),
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
     * Bulk create driver slots (for initial setup)
     */
    async bulkCreate(
        ownerId: string,
        count: number
    ): Promise<{ drivers: DriverProfile[]; credentials: { slotName: string; username: string; password: string }[] }> {
        const credentials: { slotName: string; username: string; password: string }[] = [];
        const driversToInsert: any[] = [];

        const startNumber = await this.getNextDriverNumber(ownerId);

        for (let i = 0; i < count; i++) {
            const driverNumber = startNumber + i;
            const slotName = `Driver ${driverNumber}`;
            const username = generateLoginId(driverNumber);
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
                password_hash: hashPassword(password),
            });
        }

        const { data, error } = await supabase
            .from('driver_profiles')
            .insert(driversToInsert)
            .select();

        if (error) throw error;

        return {
            drivers: (data || []) as DriverProfile[],
            credentials,
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
     * Delete the last driver for an owner (for minus button)
     */
    async deleteLastDriver(ownerId: string): Promise<void> {
        const { data } = await supabase
            .from('driver_profiles')
            .select('id')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            await supabase
                .from('driver_profiles')
                .delete()
                .eq('id', data[0].id);
        }
    },

    /**
     * Delete a driver by ID
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('driver_profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete all drivers for an owner
     */
    async deleteAllByOwner(ownerId: string): Promise<void> {
        const { error } = await supabase
            .from('driver_profiles')
            .delete()
            .eq('owner_id', ownerId);

        if (error) throw error;
    },

    /**
     * Get count of drivers for an owner
     */
    async getCount(ownerId: string): Promise<number> {
        const { count, error } = await supabase
            .from('driver_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId);

        if (error) throw error;
        return count || 0;
    },

    /**
     * Get buses that are NOT assigned to any driver (for dropdown)
     */
    async getUnassignedBuses(ownerId: string, currentDriverId?: string): Promise<any[]> {
        // Get all owner's buses
        const { data: allBuses } = await supabase
            .from('buses')
            .select('*')
            .eq('owner_id', ownerId);

        if (!allBuses) return [];

        // Get all assigned bus IDs
        const { data: drivers } = await supabase
            .from('driver_profiles')
            .select('bus_id')
            .eq('owner_id', ownerId)
            .not('bus_id', 'is', null);

        const assignedBusIds = new Set(
            drivers?.filter(d => d.bus_id && d.bus_id !== currentDriverId).map(d => d.bus_id) || []
        );

        // Return buses not in assigned set, or the current driver's bus
        return allBuses.filter(bus => {
            if (currentDriverId) {
                // If editing, include the current bus even if assigned to this driver
                const isCurrentDriversBus = drivers?.some(d => d.bus_id === bus.id);
                return !assignedBusIds.has(bus.id);
            }
            return !assignedBusIds.has(bus.id);
        });
    },
};
