"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Clock, Trash2, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, Bus, TripWithStops, DayOfWeek } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";
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

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Helper component for 12-hour time input with AM/PM
const TripTimeInput = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label?: string }) => {
    const [hour, setHour] = useState("12");
    const [minute, setMinute] = useState("00");
    const [ampm, setAmpm] = useState("AM");

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            let hNum = parseInt(h);
            const period = hNum >= 12 ? 'PM' : 'AM';
            if (hNum > 12) hNum -= 12;
            if (hNum === 0) hNum = 12;

            setHour(hNum.toString().padStart(2, '0'));
            setMinute(m);
            setAmpm(period);
        }
    }, []);

    const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
        let h = parseInt(newHour);
        if (newAmpm === 'PM' && h !== 12) h += 12;
        if (newAmpm === 'AM' && h === 12) h = 0;
        const timeStr = `${h.toString().padStart(2, '0')}:${newMinute}`;
        onChange(timeStr);

        setHour(newHour);
        setMinute(newMinute);
        setAmpm(newAmpm);
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-brand-slate mb-2 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-white">
                <select
                    value={hour}
                    onChange={(e) => updateTime(e.target.value, minute, ampm)}
                    className="bg-transparent border-0 text-lg font-medium text-brand-slate focus:outline-none focus:ring-0 cursor-pointer"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h.toString().padStart(2, '0')}>
                            {h.toString().padStart(2, '0')}
                        </option>
                    ))}
                </select>
                <span className="text-lg text-brand-grey font-medium">:</span>
                <select
                    value={minute}
                    onChange={(e) => updateTime(hour, e.target.value, ampm)}
                    className="bg-transparent border-0 text-lg font-medium text-brand-slate focus:outline-none focus:ring-0 cursor-pointer"
                >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>
                            {m.toString().padStart(2, '0')}
                        </option>
                    ))}
                </select>
                <div className="flex ml-2 bg-gray-100 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => updateTime(hour, minute, 'AM')}
                        className={`px-3 py-1.5 text-sm font-bold transition-colors ${ampm === 'AM'
                            ? 'bg-brand-green text-white'
                            : 'text-brand-grey hover:bg-gray-200'
                            }`}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => updateTime(hour, minute, 'PM')}
                        className={`px-3 py-1.5 text-sm font-bold transition-colors ${ampm === 'PM'
                            ? 'bg-brand-green text-white'
                            : 'text-brand-grey hover:bg-gray-200'
                            }`}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function BusDetailsPage({ params }: { params: Promise<{ busId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [bus, setBus] = useState<Bus | null>(null);
    const [trips, setTrips] = useState<TripWithStops[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Add trip form
    const [showAddTrip, setShowAddTrip] = useState(false);
    const [newTripStartTime, setNewTripStartTime] = useState("");
    const [newTripDays, setNewTripDays] = useState<DayOfWeek[]>(ALL_DAYS);
    const [isAddingTrip, setIsAddingTrip] = useState(false);

    useEffect(() => {
        const loadBus = async () => {
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

                // Fetch trips
                const tripData = await tripApi.getByBus(resolvedParams.busId);
                setTrips(tripData);

            } catch (err) {
                console.error('Error loading bus:', err);
                router.push("/owner");
            } finally {
                setIsLoading(false);
            }
        };

        loadBus();
    }, [resolvedParams.busId, router]);

    const handleAddTrip = async () => {
        if (!newTripStartTime || newTripDays.length === 0) {
            setError("Please select start time and at least one day");
            return;
        }

        if (!bus) return;

        setIsAddingTrip(true);
        setError("");

        try {
            const nextTripNumber = await tripApi.getNextTripNumber(bus.id);

            const newTrip = await tripApi.create({
                bus_id: bus.id,
                trip_number: nextTripNumber,
                start_time: newTripStartTime,
                days_of_week: newTripDays,
            });

            // Refresh trips list
            const updatedTrips = await tripApi.getByBus(bus.id);
            setTrips(updatedTrips);

            // Reset form
            setShowAddTrip(false);
            setNewTripStartTime("");
            setNewTripDays(ALL_DAYS);
        } catch (err: any) {
            console.error('Error adding trip:', err);
            setError(err.message || "Failed to add trip");
        } finally {
            setIsAddingTrip(false);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        if (!bus) return;

        if (!confirm('Are you sure you want to delete this trip?')) {
            return;
        }

        try {
            await tripApi.delete(tripId);
            const updatedTrips = await tripApi.getByBus(bus.id);
            setTrips(updatedTrips);
        } catch (err: any) {
            console.error('Error deleting trip:', err);
            setError(err.message || "Failed to delete trip");
        }
    };

    const toggleDay = (day: DayOfWeek) => {
        if (newTripDays.includes(day)) {
            setNewTripDays(newTripDays.filter(d => d !== day));
        } else {
            setNewTripDays([...newTripDays, day]);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    if (!bus) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Bus not found</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href="/owner">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-brand-slate">{bus.registration_number}</h1>
                    <p className="text-sm text-brand-grey">Ref: {bus.ref_number}</p>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Route Info */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center text-brand-slate mb-2">
                            <MapPin className="w-5 h-5 mr-2 text-brand-green" />
                            <span className="font-bold">{bus.route_from} → {bus.route_to}</span>
                        </div>
                        <div className="flex items-center text-sm text-brand-grey">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{trips.length} trip(s) configured</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Trip Button/Form */}
                {!showAddTrip ? (
                    <Button
                        onClick={() => setShowAddTrip(true)}
                        className="w-full py-6 bg-brand-green hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Trip
                    </Button>
                ) : (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-brand-slate mb-4">Add Trip {trips.length + 1}</h2>
                            <div className="space-y-4">
                                <TripTimeInput
                                    label="Trip Start Time"
                                    value={newTripStartTime}
                                    onChange={(val) => setNewTripStartTime(val)}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-brand-slate mb-2">
                                        Days of Service
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_DAYS.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${newTripDays.includes(day)
                                                    ? 'bg-brand-green text-white'
                                                    : 'bg-gray-100 text-brand-grey hover:bg-gray-200'
                                                    }`}
                                            >
                                                {DAY_LABELS[day]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-500">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAddTrip}
                                        className="flex-1 bg-brand-green hover:bg-green-700"
                                        disabled={isAddingTrip}
                                    >
                                        {isAddingTrip ? "Adding..." : "Add Trip"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddTrip(false);
                                            setNewTripStartTime("");
                                            setNewTripDays(ALL_DAYS);
                                            setError("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Trips List */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Daily Trips</h2>
                    {trips.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Calendar className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                                <p className="text-brand-grey">No trips added yet</p>
                                <p className="text-sm text-brand-grey mt-1">
                                    Add trips to define the bus schedule
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {trips.map((trip, index) => (
                                <motion.div
                                    key={trip.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    href={`/owner/buses/${bus.id}/trips/${trip.id}`}
                                                    className="flex-1"
                                                >
                                                    <div className="flex items-center">
                                                        <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center mr-4">
                                                            <span className="text-brand-blue font-bold">T{trip.trip_number}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-brand-slate">
                                                                Trip {trip.trip_number} - {trip.start_time}
                                                            </h3>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {trip.days_of_week.map(day => (
                                                                    <span
                                                                        key={day}
                                                                        className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded"
                                                                    >
                                                                        {DAY_LABELS[day]}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <p className="text-sm text-brand-grey mt-1">
                                                                {trip.stops?.length || 0} stops
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-brand-grey" />
                                                    </div>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTrip(trip.id)}
                                                    className="text-red-500 hover:bg-red-50 ml-2"
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
