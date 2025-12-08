"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, Profile, OwnerProfile, Bus } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { busApi } from "@/lib/api/buses";

interface OwnerAuthContextType {
    user: User | null;
    profile: Profile | null;
    ownerProfile: OwnerProfile | null;
    session: Session | null;
    buses: Bus[];
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: {
        email: string;
        password: string;
        companyName: string;
        phone: string;
    }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshBuses: () => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const OwnerAuthContext = createContext<OwnerAuthContextType | undefined>(undefined);

export function OwnerAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchOwnerData(session.user.id);
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
                    await fetchOwnerData(session.user.id);
                } else {
                    setProfile(null);
                    setOwnerProfile(null);
                    setBuses([]);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchOwnerData = async (userId: string) => {
        try {
            // Fetch base profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setIsLoading(false);
                return;
            }

            setProfile(profileData);

            // If owner, also fetch owner profile and buses
            if (profileData.role === 'owner') {
                const { data: ownerData, error: ownerError } = await supabase
                    .from('owner_profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!ownerError && ownerData) {
                    setOwnerProfile(ownerData);

                    // Fetch owner's buses
                    try {
                        const ownerBuses = await busApi.getByOwner(userId);
                        setBuses(ownerBuses);
                    } catch (error) {
                        console.error('Error fetching buses:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching owner data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Verify user is an owner
            if (data.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileData?.role !== 'owner') {
                    await supabase.auth.signOut();
                    return { success: false, error: 'This login is for fleet owners only' };
                }
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
        companyName: string;
        phone: string;
    }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        role: 'owner',
                        display_name: data.companyName,
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
        setBuses([]);
    };

    const refreshBuses = async () => {
        if (user) {
            try {
                const ownerBuses = await busApi.getByOwner(user.id);
                setBuses(ownerBuses);
            } catch (error) {
                console.error('Error refreshing buses:', error);
            }
        }
    };

    const isAuthenticated = !!user && profile?.role === 'owner';

    return (
        <OwnerAuthContext.Provider
            value={{
                user,
                profile,
                ownerProfile,
                session,
                buses,
                login,
                signup,
                logout,
                refreshBuses,
                isLoading,
                isAuthenticated,
            }}
        >
            {children}
        </OwnerAuthContext.Provider>
    );
}

export function useOwnerAuth() {
    const context = useContext(OwnerAuthContext);
    if (context === undefined) {
        throw new Error("useOwnerAuth must be used within an OwnerAuthProvider");
    }
    return context;
}
