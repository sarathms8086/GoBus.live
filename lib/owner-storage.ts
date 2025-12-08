// Owner storage utilities using localStorage

export interface Owner {
    id: string;
    companyName: string;
    email: string;
    phone: string;
    passwordHash: string;
    createdAt: string;
}

const OWNERS_KEY = "go_bus_owners";
const CURRENT_OWNER_KEY = "go_bus_current_owner";

// Simple hash function (NOT secure, for prototype only)
function hashPassword(password: string): string {
    return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

// Get all owners
export function getAllOwners(): Owner[] {
    if (typeof window === "undefined") return [];
    const ownersJson = localStorage.getItem(OWNERS_KEY);
    return ownersJson ? JSON.parse(ownersJson) : [];
}

// Save owners
function saveOwners(owners: Owner[]): void {
    localStorage.setItem(OWNERS_KEY, JSON.stringify(owners));
}

// Create owner
export function createOwner(
    companyName: string,
    email: string,
    phone: string,
    password: string
): Owner {
    const owners = getAllOwners();

    const existingOwner = owners.find(
        (o) => o.email === email || o.phone === phone
    );

    if (existingOwner) {
        throw new Error("Owner with this email or phone already exists");
    }

    const newOwner: Owner = {
        id: Date.now().toString(),
        companyName,
        email,
        phone,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };

    owners.push(newOwner);
    saveOwners(owners);

    return newOwner;
}

// Find owner
export function findOwner(emailOrPhone: string): Owner | null {
    const owners = getAllOwners();
    return (
        owners.find((o) => o.email === emailOrPhone || o.phone === emailOrPhone) ||
        null
    );
}

// Authenticate owner
export function authenticateOwner(
    emailOrPhone: string,
    password: string
): Owner | null {
    const owner = findOwner(emailOrPhone);
    if (!owner) return null;

    if (verifyPassword(password, owner.passwordHash)) {
        return owner;
    }

    return null;
}

// Set current owner
export function setCurrentOwner(ownerId: string): void {
    localStorage.setItem(CURRENT_OWNER_KEY, ownerId);
}

// Get current owner
export function getCurrentOwner(): Owner | null {
    if (typeof window === "undefined") return null;
    const ownerId = localStorage.getItem(CURRENT_OWNER_KEY);
    if (!ownerId) return null;

    const owners = getAllOwners();
    return owners.find((o) => o.id === ownerId) || null;
}

// Logout
export function logoutOwner(): void {
    localStorage.removeItem(CURRENT_OWNER_KEY);
}
