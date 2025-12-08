// Driver storage utilities using localStorage

export interface Driver {
    id: string;
    ownerId: string;
    busId: string;
    username: string;
    name: string;
    phone: string;
    passwordHash: string;
    createdAt: string;
}

const DRIVERS_KEY = "go_bus_drivers";
const CURRENT_DRIVER_KEY = "go_bus_current_driver";

// Simple hash function
function hashPassword(password: string): string {
    return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

// Get all drivers
export function getAllDrivers(): Driver[] {
    if (typeof window === "undefined") return [];
    const driversJson = localStorage.getItem(DRIVERS_KEY);
    return driversJson ? JSON.parse(driversJson) : [];
}

// Save drivers
function saveDrivers(drivers: Driver[]): void {
    localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
}

// Generate username
function generateUsername(ownerId: string): string {
    const drivers = getAllDrivers();
    const ownerDrivers = drivers.filter((d) => d.ownerId === ownerId);
    const count = ownerDrivers.length + 1;
    return `driver_${ownerId.slice(-4)}_${count.toString().padStart(3, '0')}`;
}

// Generate password
export function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Create driver
export function createDriver(
    ownerId: string,
    busId: string,
    name: string,
    phone: string,
    password: string
): Driver {
    const drivers = getAllDrivers();

    const username = generateUsername(ownerId);

    const newDriver: Driver = {
        id: Date.now().toString(),
        ownerId,
        busId,
        username,
        name,
        phone,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };

    drivers.push(newDriver);
    saveDrivers(drivers);

    return newDriver;
}

// Get drivers by owner
export function getDriversByOwner(ownerId: string): Driver[] {
    const drivers = getAllDrivers();
    return drivers.filter((d) => d.ownerId === ownerId);
}

// Get driver by ID
export function getDriverById(driverId: string): Driver | null {
    const drivers = getAllDrivers();
    return drivers.find((d) => d.id === driverId) || null;
}

// Authenticate driver
export function authenticateDriver(
    username: string,
    password: string
): Driver | null {
    const drivers = getAllDrivers();
    const driver = drivers.find((d) => d.username === username);

    if (!driver) return null;

    if (verifyPassword(password, driver.passwordHash)) {
        return driver;
    }

    return null;
}

// Set current driver
export function setCurrentDriver(driverId: string): void {
    localStorage.setItem(CURRENT_DRIVER_KEY, driverId);
}

// Get current driver
export function getCurrentDriver(): Driver | null {
    if (typeof window === "undefined") return null;
    const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
    if (!driverId) return null;

    const drivers = getAllDrivers();
    return drivers.find((d) => d.id === driverId) || null;
}

// Logout
export function logoutDriver(): void {
    localStorage.removeItem(CURRENT_DRIVER_KEY);
}

// Delete driver
export function deleteDriver(driverId: string): void {
    const drivers = getAllDrivers();
    const filteredDrivers = drivers.filter((d) => d.id !== driverId);
    saveDrivers(filteredDrivers);
}
