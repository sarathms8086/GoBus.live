"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, Profile, DriverProfile, Bus } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { driverApi } from "@/lib/api/drivers";

interface DriverAuthContextType {
    user: User | null;
    profile: Profile | null;
    driverProfile: DriverProfile | null;
    assignedBus: Bus | null;
    session: Session | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
    const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchDriverData(session.user.id);
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
                    await fetchDriverData(session.user.id);
                } else {
                    setProfile(null);
                    setDriverProfile(null);
                    setAssignedBus(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchDriverData = async (userId: string) => {
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

            // If driver, also fetch driver profile with assigned bus
            if (profileData.role === 'driver') {
                try {
                    const driverData = await driverApi.getById(userId);
                    if (driverData) {
                        setDriverProfile(driverData);
                        if (driverData.bus) {
                            setAssignedBus(driverData.bus);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching driver profile:', error);
                }
            }
        } catch (error) {
            console.error('Error fetching driver data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (
        email: string, // Drivers use email to login (username is for display)
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

            // Verify user is a driver
            if (data.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileData?.role !== 'driver') {
                    await supabase.auth.signOut();
                    return { success: false, error: 'This login is for drivers only' };
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setDriverProfile(null);
        setAssignedBus(null);
    };

    const isAuthenticated = !!user && profile?.role === 'driver';

    return (
        <DriverAuthContext.Provider
            value={{
                user,
                profile,
                driverProfile,
                assignedBus,
                session,
                login,
                logout,
                isLoading,
                isAuthenticated,
            }}
        >
            {children}
        </DriverAuthContext.Provider>
    );
}

export function useDriverAuth() {
    const context = useContext(DriverAuthContext);
    if (context === undefined) {
        throw new Error("useDriverAuth must be used within a DriverAuthProvider");
    }
    return context;
}
