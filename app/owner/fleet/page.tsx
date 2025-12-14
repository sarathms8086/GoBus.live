"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BusFront,
    MapPin,
    Users,
    Clock,
    ArrowLeft,
    Activity,
    TrendingUp,
    User,
    Circle,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, Bus, DriverProfile, TripWithStops } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";
import { tripApi } from "@/lib/api/trips";

interface BusWithDetails extends Bus {
    trips?: TripWithStops[];
    driver?: DriverProfile | null;
    ticketCount?: number;
    revenue?: number;
}

export default function FleetManagementPage() {
    const router = useRouter();
    const [buses, setBuses] = useState<BusWithDetails[]>([]);
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBus, setSelectedBus] = useState<BusWithDetails | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/owner/auth/login");
                    return;
                }

                // Fetch buses
                const ownerBuses = await busApi.getByOwner(session.user.id);

                // Fetch drivers
                const { data: driversData } = await supabase
                    .from('driver_profiles')
                    .select('*')
                    .eq('owner_id', session.user.id);

                setDrivers(driversData || []);

                // Fetch trips and ticket data for each bus
                const busesWithDetails: BusWithDetails[] = await Promise.all(
                    ownerBuses.map(async (bus) => {
                        // Get trips
                        const trips = await tripApi.getByBus(bus.id);

                        // Get assigned driver
                        const driver = (driversData || []).find(d => d.bus_id === bus.id) || null;

                        // Get ticket revenue (mock for now - will be real when tickets table has data)
                        const { data: tickets } = await supabase
                            .from('tickets')
                            .select('amount')
                            .eq('bus_id', bus.id);

                        const revenue = (tickets || []).reduce((sum, t) => sum + (t.amount || 0), 0);
                        const ticketCount = (tickets || []).length;

                        return {
                            ...bus,
                            trips,
                            driver,
                            ticketCount,
                            revenue,
                        };
                    })
                );

                setBuses(busesWithDetails);
                setIsLoading(false);
            } catch (err) {
                console.error('Error loading fleet data:', err);
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Helper to format time nicely
    const formatTime = (time24: string) => {
        if (!time24) return '--:--';
        const [h, m] = time24.split(':');
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        return `${hour}:${m} ${ampm}`;
    };

    // Calculate occupancy percentage
    const getOccupancyPercent = (bus: BusWithDetails) => {
        if (!bus.total_seats || bus.total_seats === 0) return 0;
        return Math.round((bus.current_passengers / bus.total_seats) * 100);
    };

    // Get bus status based on current passengers
    const getBusStatus = (bus: BusWithDetails) => {
        if (bus.current_passengers > 0) return { label: 'Active', color: 'text-green-500', bg: 'bg-green-500' };
        return { label: 'Idle', color: 'text-gray-400', bg: 'bg-gray-400' };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading fleet data...</p>
            </div>
        );
    }

    // If a bus is selected, show its details
    if (selectedBus) {
        const status = getBusStatus(selectedBus);
        const occupancy = getOccupancyPercent(selectedBus);

        return (
            <main className="min-h-screen bg-brand-cloud pb-20">
                <header className="bg-white shadow-sm p-4 flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedBus(null)}>
                        <ArrowLeft className="w-5 h-5 text-brand-slate" />
                    </Button>
                    <h1 className="text-xl font-bold text-brand-slate ml-2">{selectedBus.registration_number}</h1>
                </header>

                <div className="p-4 space-y-4">
                    {/* Status Card */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-brand-slate">Live Status</h2>
                                <div className="flex items-center gap-2">
                                    <Circle className={`w-3 h-3 ${status.bg} fill-current`} />
                                    <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-brand-grey mb-1">Occupancy</p>
                                    <p className="text-2xl font-bold text-brand-slate">{occupancy}%</p>
                                    <p className="text-xs text-brand-grey">{selectedBus.current_passengers}/{selectedBus.total_seats} seats</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-brand-grey mb-1">Current Stop</p>
                                    <p className="text-lg font-bold text-brand-slate">{selectedBus.current_stop || 'Not set'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assigned Driver Card */}
                    <Card>
                        <CardContent className="p-4">
                            <h2 className="font-bold text-brand-slate mb-3">Assigned Driver</h2>
                            {selectedBus.driver ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-brand-green" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-brand-slate">{selectedBus.driver.name}</p>
                                        <p className="text-sm text-brand-grey">@{selectedBus.driver.username}</p>
                                        {selectedBus.driver.phone && (
                                            <p className="text-sm text-brand-grey">{selectedBus.driver.phone}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-brand-grey">No driver assigned</p>
                                    <Link href="/owner/drivers">
                                        <Button size="sm" variant="outline" className="mt-2">
                                            Assign Driver
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Route Info Card */}
                    <Card>
                        <CardContent className="p-4">
                            <h2 className="font-bold text-brand-slate mb-3">Route Information</h2>
                            <div className="flex items-center gap-2 text-brand-grey">
                                <MapPin className="w-4 h-4 text-brand-green" />
                                <span>{selectedBus.route_from}</span>
                                <span>→</span>
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span>{selectedBus.route_to}</span>
                            </div>
                            <p className="text-sm text-brand-grey mt-2">{selectedBus.trips?.length || 0} trips configured</p>
                        </CardContent>
                    </Card>

                    {/* Revenue & Analytics Card */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-bold text-brand-slate">Revenue Analytics</h2>
                                <TrendingUp className="w-5 h-5 text-brand-green" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-xl p-3">
                                    <p className="text-xs text-brand-grey mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">₹{selectedBus.revenue?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <p className="text-xs text-brand-grey mb-1">Tickets Sold</p>
                                    <p className="text-2xl font-bold text-blue-600">{selectedBus.ticketCount || 0}</p>
                                </div>
                            </div>

                            {(selectedBus.ticketCount || 0) === 0 && (
                                <p className="text-xs text-center text-brand-grey mt-3">
                                    No tickets sold yet. Revenue will appear here as customers book.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link href={`/owner/buses/${selectedBus.id}`}>
                            <Button variant="outline" className="w-full">
                                Manage Trips
                            </Button>
                        </Link>
                        <Link href="/owner/drivers">
                            <Button variant="outline" className="w-full">
                                Manage Drivers
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Bus list view
    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4">
                <h1 className="text-2xl font-bold text-brand-slate">Fleet Management</h1>
                <p className="text-sm text-brand-grey">Monitor your buses in real-time</p>
            </header>

            <div className="p-4 space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <CardContent className="p-3 text-center">
                            <BusFront className="w-6 h-6 text-brand-green mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">{buses.length}</p>
                            <p className="text-xs text-brand-grey">Buses</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <Users className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">{drivers.length}</p>
                            <p className="text-xs text-brand-grey">Drivers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <Activity className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">
                                {buses.filter(b => b.current_passengers > 0).length}
                            </p>
                            <p className="text-xs text-brand-grey">Active</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Total Revenue */}
                <Card className="bg-gradient-to-r from-green-500 to-green-600">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-white">
                            <div>
                                <p className="text-sm opacity-80">Total Fleet Revenue</p>
                                <p className="text-3xl font-bold">
                                    ₹{buses.reduce((sum, b) => sum + (b.revenue || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Bus List */}
                <div>
                    <h2 className="font-bold text-brand-slate mb-3">All Buses</h2>
                    {buses.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <BusFront className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                <p className="text-brand-grey mb-4">No buses registered yet</p>
                                <Link href="/owner/buses/add">
                                    <Button className="bg-brand-green hover:bg-green-700">
                                        Add Your First Bus
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {buses.map((bus, index) => {
                                const status = getBusStatus(bus);
                                const occupancy = getOccupancyPercent(bus);

                                return (
                                    <motion.div
                                        key={bus.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card
                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setSelectedBus(bus)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center">
                                                            <BusFront className="w-6 h-6 text-brand-green" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-brand-slate">{bus.registration_number}</h3>
                                                                <div className="flex items-center gap-1">
                                                                    <Circle className={`w-2 h-2 ${status.bg} fill-current`} />
                                                                    <span className={`text-xs ${status.color}`}>{status.label}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-brand-grey">{bus.route_from} → {bus.route_to}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-xs text-brand-grey">
                                                                    <Users className="w-3 h-3 inline mr-1" />
                                                                    {bus.driver?.name || 'No driver'}
                                                                </span>
                                                                <span className="text-xs text-brand-grey">
                                                                    {occupancy}% full
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
