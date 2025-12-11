"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, TripWithStops, Bus, DayOfWeek } from "@/lib/supabase";
import { tripApi } from "@/lib/api/trips";

const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
};

export default function TripDetailsPage({
    params
}: {
    params: Promise<{ busId: string; tripId: string }>
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [bus, setBus] = useState<Bus | null>(null);
    const [trip, setTrip] = useState<TripWithStops | null>(null);
    const [stopName, setStopName] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingStop, setIsAddingStop] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/owner/auth/login");
                    return;
                }

                // Fetch bus
                const { data: busData, error: busError } = await supabase
                    .from('buses')
                    .select('*')
                    .eq('id', resolvedParams.busId)
                    .single();

                if (busError || !busData) {
                    router.push("/owner");
                    return;
                }

                if (busData.owner_id !== session.user.id) {
                    router.push("/owner");
                    return;
                }

                setBus(busData);

                // Fetch trip
                const tripData = await tripApi.getById(resolvedParams.tripId);
                if (!tripData) {
                    router.push(`/owner/buses/${resolvedParams.busId}`);
                    return;
                }

                setTrip(tripData);

            } catch (err) {
                console.error('Error loading trip:', err);
                router.push("/owner");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [resolvedParams.busId, resolvedParams.tripId, router]);

    const handleAddStop = async () => {
        if (!stopName || !arrivalTime) {
            setError("Please fill in all fields");
            return;
        }

        if (!trip) return;

        setIsAddingStop(true);
        setError("");

        try {
            const updatedTrip = await tripApi.addStop(trip.id, {
                name: stopName,
                arrival_time: arrivalTime,
            });

            setTrip(updatedTrip);
            setStopName("");
            setArrivalTime("");
        } catch (err: any) {
            console.error('Error adding stop:', err);
            setError(err.message || "Failed to add stop");
        } finally {
            setIsAddingStop(false);
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!trip) return;

        try {
            const updatedTrip = await tripApi.deleteStop(trip.id, stopId);
            setTrip(updatedTrip);
        } catch (err: any) {
            console.error('Error deleting stop:', err);
            setError(err.message || "Failed to delete stop");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    if (!bus || !trip) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Trip not found</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href={`/owner/buses/${bus.id}`}>
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-brand-slate">
                        Trip {trip.trip_number} - {trip.start_time}
                    </h1>
                    <p className="text-sm text-brand-grey">{bus.registration_number}</p>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Trip Info */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center text-brand-slate mb-2">
                            <MapPin className="w-5 h-5 mr-2 text-brand-green" />
                            <span className="font-bold">{bus.route_from} → {bus.route_to}</span>
                        </div>
                        <div className="flex items-center text-sm text-brand-grey mb-2">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Starts at {trip.start_time}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {trip.days_of_week.map(day => (
                                <span
                                    key={day}
                                    className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded"
                                >
                                    {DAY_LABELS[day]}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Add Stop Form */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-brand-slate mb-4">Add Stop</h2>
                        <div className="space-y-4">
                            <Input
                                label="Stop Name"
                                type="text"
                                placeholder="e.g., Silk Board Junction"
                                value={stopName}
                                onChange={(e) => setStopName(e.target.value)}
                            />
                            <Input
                                label="Arrival Time"
                                type="time"
                                value={arrivalTime}
                                onChange={(e) => setArrivalTime(e.target.value)}
                            />
                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}
                            <Button
                                onClick={handleAddStop}
                                className="w-full bg-brand-green hover:bg-green-700"
                                disabled={isAddingStop}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {isAddingStop ? "Adding..." : "Add Stop"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stops List */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Trip Stops</h2>
                    {!trip.stops || trip.stops.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MapPin className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                                <p className="text-brand-grey">No stops added yet</p>
                                <p className="text-sm text-brand-grey mt-1">
                                    Add stops to define the trip route
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {trip.stops.map((stop, index) => (
                                <motion.div
                                    key={stop.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center mr-3 shrink-0">
                                                        <span className="text-white text-sm font-bold">{stop.sequence}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-brand-slate">{stop.name}</h3>
                                                        <p className="text-sm text-brand-grey">{stop.arrival_time}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteStop(stop.id)}
                                                    className="text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
