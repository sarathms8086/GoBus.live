// Simple user storage utilities using localStorage

export interface User {
    id: string;
    username: string;
    email: string;
    phone: string;
    passwordHash: string;
    createdAt: string;
}

const USERS_KEY = "go_bus_users";
const CURRENT_USER_KEY = "go_bus_current_user";

// Simple hash function (NOT secure, for prototype only)
export function hashPassword(password: string): string {
    return btoa(password); // Base64 encoding (NOT secure for production)
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

// Get all users from localStorage
export function getAllUsers(): User[] {
    if (typeof window === "undefined") return [];
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
}

// Save users to localStorage
function saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Create a new user
export function createUser(
    username: string,
    email: string,
    phone: string,
    password: string
): User {
    const users = getAllUsers();

    // Check if user already exists
    const existingUser = users.find(
        (u) => u.email === email || u.phone === phone
    );

    if (existingUser) {
        throw new Error("User with this email or phone already exists");
    }

    const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        phone,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    return newUser;
}

// Find user by email or phone
export function findUser(emailOrPhone: string): User | null {
    const users = getAllUsers();
    return (
        users.find((u) => u.email === emailOrPhone || u.phone === emailOrPhone) ||
        null
    );
}

// Authenticate user
export function authenticateUser(
    emailOrPhone: string,
    password: string
): User | null {
    const user = findUser(emailOrPhone);
    if (!user) return null;

    if (verifyPassword(password, user.passwordHash)) {
        return user;
    }

    return null;
}

// Set current user
export function setCurrentUser(userId: string): void {
    localStorage.setItem(CURRENT_USER_KEY, userId);
}

// Get current user
export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;

    const users = getAllUsers();
    return users.find((u) => u.id === userId) || null;
}

// Logout
export function logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
}
