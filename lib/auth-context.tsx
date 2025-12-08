"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, Profile, OwnerProfile } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    ownerProfile: OwnerProfile | null;
    session: Session | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: {
        email: string;
        password: string;
        displayName: string;
        phone: string;
        role?: 'customer' | 'owner';
        companyName?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isLoading: boolean;
    isOwner: boolean;
    isDriver: boolean;
    isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                    setOwnerProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // Fetch base profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!profileError && profileData) {
                setProfile(profileData);

                // If owner, also fetch owner profile
                if (profileData.role === 'owner') {
                    const { data: ownerData, error: ownerError } = await supabase
                        .from('owner_profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (!ownerError && ownerData) {
                        setOwnerProfile(ownerData);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    const signup = async (data: {
        email: string;
        password: string;
        displayName: string;
        phone: string;
        role?: 'customer' | 'owner';
        companyName?: string;
    }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        role: data.role || 'customer',
                        display_name: data.displayName,
                        company_name: data.companyName,
                    },
                },
            });

            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setOwnerProfile(null);
    };

    const isOwner = profile?.role === 'owner';
    const isDriver = profile?.role === 'driver';
    const isCustomer = profile?.role === 'customer';

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                ownerProfile,
                session,
                login,
                signup,
                logout,
                isLoading,
                isOwner,
                isDriver,
                isCustomer,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Legacy compatibility export - maps to new structure
// This helps existing code continue to work during migration
export type LegacyUser = {
    id: string;
    username: string;
    email: string;
    phone: string;
};

export function useLegacyAuth() {
    const { user, profile, login, signup, logout, isLoading } = useAuth();

    const legacyUser: LegacyUser | null = user && profile ? {
        id: user.id,
        username: profile.display_name || user.email?.split('@')[0] || 'user',
        email: user.email || '',
        phone: profile.phone || '',
    } : null;

    const legacyLogin = async (emailOrPhone: string, password: string): Promise<boolean> => {
        const result = await login(emailOrPhone, password);
        return result.success;
    };

    const legacySignup = async (
        username: string,
        email: string,
        phone: string,
        password: string
    ): Promise<boolean> => {
        const result = await signup({
            email,
            password,
            displayName: username,
            phone,
            role: 'customer',
        });
        return result.success;
    };

    return {
        user: legacyUser,
        login: legacyLogin,
        signup: legacySignup,
        logout,
        isLoading,
    };
}
