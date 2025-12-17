import { supabase, DriverProfile, DriverWithBus } from '@/lib/supabase';

/**
 * Extract the last 4 digits from a vehicle registration number
 * Indian format: KL-45-N6225 → extracts "6225"
 */
function extractRegistrationSuffix(registrationNumber: string): string {
    // Remove all non-alphanumeric characters and get last 4 characters
    const cleaned = registrationNumber.replace(/[^a-zA-Z0-9]/g, '');
    // Get last 4 digits only
    const digits = cleaned.replace(/[^0-9]/g, '');
    return digits.slice(-4) || '0000';
}

/**
 * Generate login ID: D + driverNumber + last 4 digits from bus registration
 * Format: D16225 where D1 = Driver 1, and 6225 is from bus registration KL-45-N6225
 * Examples: D16225 (Driver 1), D26225 (Driver 2), D36225 (Driver 3)
 */
function generateLoginId(driverNumber: number, registrationSuffix: string): string {
    return `D${driverNumber}${registrationSuffix}`;
}

/**
 * Generate 4-digit password like "1234"
 */
function generateSimplePassword(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Encode password for storage (reversible)
 */
function encodePassword(password: string): string {
    return btoa(password);
}

/**
 * Decode password from storage
 */
export function decodePassword(encodedPassword: string): string {
    try {
        return atob(encodedPassword);
    } catch {
        return '••••';
    }
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
    return encodePassword(password) === hash;
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
        console.log("Authenticating driver:", username);

        try {
            const { data, error } = await supabase
                .from('driver_profiles')
                .select(`
                    *,
                    bus:buses(*)
                `)
                .eq('username', username)
                .maybeSingle();

            console.log("Query completed, error:", error?.message || "none");
            console.log("Query completed, data:", data ? "found" : "not found");

            if (error) {
                console.log("Query error:", error.message);
                return null;
            }

            if (!data) {
                console.log("Driver not found with username:", username);
                return null;
            }

            console.log("Driver found:", data.slot_name);
            console.log("Stored hash:", data.password_hash);
            console.log("Input password:", password);
            console.log("Encoded input:", encodePassword(password));

            // Check if password matches
            if (data.password_hash) {
                // Try normal verification (base64 encoded)
                if (verifyPassword(password, data.password_hash)) {
                    console.log("Password verified!");
                    return data as DriverWithBus;
                }
                // Fallback: maybe stored password is plain text
                if (data.password_hash === password) {
                    console.log("Plain text password match!");
                    return data as DriverWithBus;
                }
                console.log("Password mismatch");
            }

            return null;
        } catch (err: any) {
            console.error("Authentication error:", err.message || err);
            return null;
        }
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

        // Get owner's first bus registration to create login ID
        const { data: buses } = await supabase
            .from('buses')
            .select('registration_number')
            .eq('owner_id', ownerId)
            .limit(1);

        let registrationSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        if (buses && buses.length > 0 && buses[0].registration_number) {
            registrationSuffix = extractRegistrationSuffix(buses[0].registration_number);
        }

        const username = generateLoginId(driverNumber, registrationSuffix);
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
                password_hash: encodePassword(password),
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

        // Get owner's first bus registration to create login IDs
        const { data: buses } = await supabase
            .from('buses')
            .select('registration_number')
            .eq('owner_id', ownerId)
            .limit(1);

        let registrationSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        if (buses && buses.length > 0 && buses[0].registration_number) {
            registrationSuffix = extractRegistrationSuffix(buses[0].registration_number);
        }

        for (let i = 0; i < count; i++) {
            const driverNumber = startNumber + i;
            const slotName = `Driver ${driverNumber}`;
            const username = generateLoginId(driverNumber, registrationSuffix);
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
                password_hash: encodePassword(password),
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
     * Fix an existing driver's login ID to use the new format
     * Extracts driver number from slot_name and generates new ID using bus registration
     */
    async fixLoginId(driverId: string): Promise<{ username: string; password: string }> {
        // Get the driver to find their slot_name and owner_id
        const { data: driver, error: fetchError } = await supabase
            .from('driver_profiles')
            .select('slot_name, owner_id')
            .eq('id', driverId)
            .single();

        if (fetchError || !driver) throw new Error('Driver not found');

        // Extract driver number from slot_name
        // Handles both "Driver 3" (number) and "Driver C" (letter) formats
        let driverNumber = 1;
        const slotName = driver.slot_name || '';

        // Try number format first: "Driver 3"
        const numberMatch = slotName.match(/Driver (\d+)/);
        if (numberMatch) {
            driverNumber = parseInt(numberMatch[1]);
        } else {
            // Try letter format: "Driver A", "Driver B", etc.
            const letterMatch = slotName.match(/Driver ([A-Za-z])/);
            if (letterMatch) {
                // Convert letter to number: A=1, B=2, C=3, etc.
                driverNumber = letterMatch[1].toUpperCase().charCodeAt(0) - 64;
            }
        }

        // Get owner's first bus registration to create login ID
        const { data: buses } = await supabase
            .from('buses')
            .select('registration_number')
            .eq('owner_id', driver.owner_id)
            .limit(1);

        let registrationSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        if (buses && buses.length > 0 && buses[0].registration_number) {
            registrationSuffix = extractRegistrationSuffix(buses[0].registration_number);
        }

        const username = generateLoginId(driverNumber, registrationSuffix);
        const password = generateSimplePassword();

        const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({
                username,
                password_hash: encodePassword(password),
            })
            .eq('id', driverId);

        if (updateError) throw updateError;

        return { username, password };
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
