import { supabase, DriverProfile, DriverWithBus } from '@/lib/supabase';

/**
 * Generate simple password like "A1234"
 */
function generateSimplePassword(slotLetter: string): string {
    const numbers = Math.floor(1000 + Math.random() * 9000).toString();
    return `${slotLetter}${numbers}`;
}

/**
 * Simple hash function for password (base64 encoding)
 * Note: In production, use proper bcrypt hashing
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

/**
 * Get the next slot letter for an owner (A, B, C, etc.)
 */
async function getNextSlotLetter(ownerId: string): Promise<string> {
    const { data: existingDrivers } = await supabase
        .from('driver_profiles')
        .select('slot_name')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

    if (!existingDrivers || existingDrivers.length === 0) {
        return 'A';
    }

    // Find the highest slot letter used
    const usedLetters = existingDrivers.map(d => {
        const match = d.slot_name?.match(/Driver ([A-Z])/);
        return match ? match[1].charCodeAt(0) - 65 : -1;
    }).filter(n => n >= 0);

    if (usedLetters.length === 0) return 'A';

    const maxIndex = Math.max(...usedLetters);
    return String.fromCharCode(65 + maxIndex + 1);
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

        // Verify password
        if (data.password_hash && verifyPassword(password, data.password_hash)) {
            return data as DriverWithBus;
        }
        return null;
    },

    /**
     * Bulk create driver slots
     * Creates multiple driver slots at once with auto-generated credentials
     */
    async bulkCreate(
        ownerId: string,
        count: number
    ): Promise<{ drivers: DriverProfile[]; credentials: { slotName: string; username: string; password: string }[] }> {
        const credentials: { slotName: string; username: string; password: string }[] = [];
        const driversToInsert: any[] = [];

        // Get starting slot letter
        let currentLetter = await getNextSlotLetter(ownerId);
        let letterCode = currentLetter.charCodeAt(0);

        for (let i = 0; i < count; i++) {
            const slotLetter = String.fromCharCode(letterCode + i);
            const slotName = `Driver ${slotLetter}`;
            const username = `${slotLetter.toLowerCase()}${ownerId.slice(-4)}`;
            const password = generateSimplePassword(slotLetter);

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
};
