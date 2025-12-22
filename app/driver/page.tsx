"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, User, Clock, MapPin, Navigation, Radio } from "lucide-react";
import { motion } from "framer-motion";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

interface TripStop {
    id: string;
    name: string;
    arrival_time: string;
    sequence: number;
}

interface Trip {
    id: string;
    trip_number: number;
    start_time: string;
    end_time: string | null;
    days_of_week: string[];
    is_active: boolean;
    stops: TripStop[];
}

interface BusInfo {
    id: string;
    registration_number: string;
    route_from: string;
    route_to: string;
    ref_number: string;
}

interface DriverInfo {
    id: string;
    username: string;
    slot_name: string;
    remarks: string | null;
    name: string | null;
    phone: string | null;
}

export default function DriverDashboard() {
    const router = useRouter();
    const [driver, setDriver] = useState<DriverInfo | null>(null);
    const [bus, setBus] = useState<BusInfo | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadDashboardData();

        // Update time every second for countdown
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    const loadDashboardData = async () => {
        const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
        if (!driverId) {
            router.push("/driver/auth/login");
            return;
        }

        try {
            const response = await fetch(`/api/driver/dashboard?driverId=${driverId}`);
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    localStorage.removeItem(CURRENT_DRIVER_KEY);
                    router.push("/driver/auth/login");
                    return;
                }
                throw new Error(result.error || 'Failed to load dashboard');
            }

            setDriver(result.driver);
            setBus(result.bus);
            setTrips(result.trips || []);
        } catch (err: any) {
            console.error("Error loading dashboard:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Parse time string (HH:MM) to today's date object
    const parseTimeToDate = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // Get trip status based on current time
    const getTripStatus = (trip: Trip): { status: 'upcoming' | 'live' | 'completed'; timeLeft?: string; progress?: number } => {
        const now = currentTime;
        const startTime = parseTimeToDate(trip.start_time);

        // Get end time from last stop or estimate 2 hours after start
        let endTime: Date;
        if (trip.stops && trip.stops.length > 0) {
            const lastStop = trip.stops[trip.stops.length - 1];
            endTime = parseTimeToDate(lastStop.arrival_time);
        } else if (trip.end_time) {
            endTime = parseTimeToDate(trip.end_time);
        } else {
            endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
        }

        // Check if today is a scheduled day
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = dayNames[now.getDay()];
        const isScheduledToday = trip.days_of_week?.includes(today);

        if (!isScheduledToday) {
            return { status: 'completed' }; // Not running today
        }

        if (now < startTime) {
            // Upcoming - calculate time left
            const diffMs = startTime.getTime() - now.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            let timeLeft = '';
            if (hours > 0) {
                timeLeft = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                timeLeft = `${minutes}m ${seconds}s`;
            } else {
                timeLeft = `${seconds}s`;
            }

            return { status: 'upcoming', timeLeft };
        } else if (now >= startTime && now <= endTime) {
            // Live
            const totalDuration = endTime.getTime() - startTime.getTime();
            const elapsed = now.getTime() - startTime.getTime();
            const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
            return { status: 'live', progress };
        } else {
            // Completed
            return { status: 'completed' };
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-brand-grey">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => router.push("/driver/auth/login")}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Login
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Sort trips: live first, then upcoming, then completed
    const sortedTrips = [...trips].sort((a, b) => {
        const statusA = getTripStatus(a).status;
        const statusB = getTripStatus(b).status;
        const order = { live: 0, upcoming: 1, completed: 2 };
        return order[statusA] - order[statusB];
    });

    return (
        <div className="min-h-screen bg-brand-cloud pb-24">
            {/* Header */}
            <div className="bg-brand-blue px-6 py-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
                </div>
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {driver?.remarks || driver?.username || 'Driver'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                                ID: {driver?.username}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bus Info Card */}
            <div className="px-4 -mt-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {bus ? (
                        <Card className="shadow-lg border-0 overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center">
                                        <Bus className="w-7 h-7 text-brand-green" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-brand-grey text-xs uppercase tracking-wider">Assigned Bus</p>
                                        <p className="text-2xl font-bold text-brand-slate">{bus.registration_number}</p>
                                        <p className="text-brand-grey text-sm flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {bus.route_from} → {bus.route_to}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="p-5 text-center">
                                <p className="text-yellow-800">
                                    ⚠️ No bus assigned yet. Contact your fleet owner.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </div>

            {/* Trips Section */}
            {bus && (
                <div className="px-4 mt-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-lg font-bold text-brand-slate mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-brand-blue" />
                            Today's Trips
                        </h2>

                        {sortedTrips.length > 0 ? (
                            <div className="space-y-4">
                                {sortedTrips.map((trip, index) => {
                                    const tripStatus = getTripStatus(trip);
                                    const firstStop = trip.stops?.[0]?.name || bus.route_from;
                                    const lastStop = trip.stops?.[trip.stops.length - 1]?.name || bus.route_to;

                                    return (
                                        <motion.div
                                            key={trip.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                        >
                                            <Card className={`overflow-hidden shadow-md transition-all duration-300 ${tripStatus.status === 'live'
                                                    ? 'border-2 border-brand-green bg-green-50 ring-2 ring-green-200'
                                                    : tripStatus.status === 'upcoming'
                                                        ? 'border border-gray-200 bg-white hover:shadow-lg'
                                                        : 'border border-gray-100 bg-gray-50 opacity-60'
                                                }`}>
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-xl font-bold text-brand-slate">
                                                                    Trip {trip.trip_number}
                                                                </h3>
                                                                {tripStatus.status === 'live' && (
                                                                    <span className="flex items-center gap-1 bg-brand-green text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                                                        <Radio className="w-3 h-3" />
                                                                        LIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-brand-grey text-sm mt-1">
                                                                Starts at {formatTime(trip.start_time)}
                                                            </p>
                                                        </div>

                                                        {/* Status Indicator */}
                                                        <div className="text-right">
                                                            {tripStatus.status === 'upcoming' && tripStatus.timeLeft && (
                                                                <div className="bg-brand-blue/10 rounded-xl px-4 py-2">
                                                                    <p className="text-brand-blue text-xs">Starts in</p>
                                                                    <p className="text-2xl font-bold text-brand-blue font-mono">
                                                                        {tripStatus.timeLeft}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {tripStatus.status === 'completed' && (
                                                                <span className="text-gray-400 text-sm">Completed</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Route Display */}
                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 bg-brand-green rounded-full"></div>
                                                                <span className="text-brand-slate font-medium">{firstStop}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 flex items-center gap-1 text-brand-grey">
                                                            <div className="w-8 h-0.5 bg-gray-300"></div>
                                                            <span className="text-xs">{trip.stops?.length || 0} stops</span>
                                                            <div className="w-8 h-0.5 bg-gray-300"></div>
                                                        </div>
                                                        <div className="flex-1 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className="text-brand-slate font-medium">{lastStop}</span>
                                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar for Live Trips */}
                                                    {tripStatus.status === 'live' && tripStatus.progress !== undefined && (
                                                        <div className="mt-4">
                                                            <div className="flex justify-between text-xs text-brand-grey mb-1">
                                                                <span>Progress</span>
                                                                <span>{tripStatus.progress}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-brand-green rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${tripStatus.progress}%` }}
                                                                    transition={{ duration: 0.5 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="border-gray-200">
                                <CardContent className="p-8 text-center">
                                    <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-brand-grey text-lg">No trips scheduled</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Your fleet owner will add trips for your bus.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Current Time Display */}
            <div className="fixed bottom-20 left-0 right-0 px-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 text-center shadow-lg border border-gray-100">
                    <p className="text-brand-grey text-xs">Current Time</p>
                    <p className="text-brand-slate font-mono text-lg font-bold">
                        {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}
