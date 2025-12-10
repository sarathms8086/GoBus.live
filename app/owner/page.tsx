"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, BusFront, MapPin, Clock, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, OwnerProfile, BusWithStops } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";
import { motion } from "framer-motion";

export default function OwnerDashboard() {
    const router = useRouter();
    const [owner, setOwner] = useState<OwnerProfile | null>(null);
    const [buses, setBuses] = useState<BusWithStops[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            // Fetch owner profile
            const { data: ownerData, error: ownerError } = await supabase
                .from('owner_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (ownerError || !ownerData) {
                // Not an owner, redirect to login
                router.push("/owner/auth/login");
                return;
            }

            setOwner(ownerData);

            // Fetch owner's buses
            try {
                const ownerBuses = await busApi.getByOwner(session.user.id);
                setBuses(ownerBuses);
            } catch (error) {
                console.error('Error fetching buses:', error);
            }

            setIsLoading(false);
        };

        checkAuthAndLoadData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    router.push("/owner/auth/login");
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-slate">{owner?.company_name}</h1>
                        <p className="text-sm text-brand-grey mt-1">Fleet Management</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 text-brand-grey" />
                    </Button>
                </div>
            </header>

            {/* Stats */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-brand-grey">Total Buses</p>
                                    <p className="text-2xl font-bold text-brand-slate">{buses.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
                                    <BusFront className="w-6 h-6 text-brand-green" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-brand-grey">Total Routes</p>
                                    <p className="text-2xl font-bold text-brand-slate">{buses.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-brand-blue" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Link href="/owner/buses/add">
                        <Button className="w-full py-6 bg-brand-green hover:bg-green-700">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Bus
                        </Button>
                    </Link>
                    <Link href="/owner/drivers">
                        <Button variant="outline" className="w-full py-6">
                            <Users className="w-5 h-5 mr-2" />
                            Manage Drivers
                        </Button>
                    </Link>
                </div>

                {/* Registered Buses */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Registered Buses</h2>

                    {buses.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <BusFront className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                                <p className="text-brand-grey mb-4">No buses registered yet</p>
                                <Link href="/owner/buses/add">
                                    <Button className="bg-brand-green hover:bg-green-700">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Your First Bus
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {buses.map((bus, index) => (
                                <motion.div
                                    key={bus.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link href={`/owner/buses/${bus.id}`}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mr-3">
                                                            <BusFront className="w-6 h-6 text-brand-green" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-brand-slate">{bus.registration_number}</h3>
                                                            <p className="text-xs text-brand-grey">Ref: {bus.ref_number}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-sm text-brand-grey mb-2">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span>{bus.route_from} → {bus.route_to}</span>
                                                </div>

                                                <div className="flex items-center text-sm text-brand-grey">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>{bus.stops?.length || 0} stops</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
