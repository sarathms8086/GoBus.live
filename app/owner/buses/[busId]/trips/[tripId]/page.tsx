"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Clock, Trash2, Check, ArrowRight } from "lucide-react";
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

// Helper component for 12-hour time input
const CustomTimeInput = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    // Parse initial value (HH:MM 24h format)
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
    }, [value]);

    const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
        let h = parseInt(newHour);
        if (newAmpm === 'PM' && h !== 12) h += 12;
        if (newAmpm === 'AM' && h === 12) h = 0;
        const timeStr = `${h.toString().padStart(2, '0')}:${newMinute}`;
        onChange(timeStr);

        // Update local state immediately for UI responsiveness
        setHour(newHour);
        setMinute(newMinute);
        setAmpm(newAmpm);
    };

    return (
        <div className="flex items-center gap-1">
            <select
                value={hour}
                onChange={(e) => updateTime(e.target.value, minute, ampm)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h.toString().padStart(2, '0')}>
                        {h.toString().padStart(2, '0')}
                    </option>
                ))}
            </select>
            <span className="text-gray-400">:</span>
            <select
                value={minute}
                onChange={(e) => updateTime(hour, e.target.value, ampm)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
                {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <option key={m} value={m.toString().padStart(2, '0')}>
                        {m.toString().padStart(2, '0')}
                    </option>
                ))}
            </select>
            <select
                value={ampm}
                onChange={(e) => updateTime(hour, minute, e.target.value)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green font-medium"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
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
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Bulk Add State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [stopCountToGenerate, setStopCountToGenerate] = useState<number | string>("");
    const [newStops, setNewStops] = useState<{ name: string; arrivalTime: string }[]>([]);
    const [isSavingStops, setIsSavingStops] = useState(false);

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

    const handleGenerateTable = () => {
        if (!stopCountToGenerate || stopCountToGenerate === "") {
            setError("Please enter the number of stops to add");
            return;
        }

        const rawCount = typeof stopCountToGenerate === 'string' ? parseInt(stopCountToGenerate) : stopCountToGenerate;

        if (isNaN(rawCount) || rawCount < 1) {
            setError("Please enter a valid number of stops (minimum 1)");
            return;
        }

        const count = Math.min(20, rawCount);
        // Default time 9:00 AM
        setNewStops(Array(count).fill(null).map(() => ({ name: "", arrivalTime: "09:00" })));
        setIsBulkMode(true);
        setError("");
    };

    const updateNewStop = (index: number, field: 'name' | 'arrivalTime', value: string) => {
        const updated = [...newStops];
        updated[index] = { ...updated[index], [field]: value };
        setNewStops(updated);
    };

    const handleSaveStops = async () => {
        if (!trip) return;

        // Validate
        for (let i = 0; i < newStops.length; i++) {
            if (!newStops[i].name || !newStops[i].arrivalTime) {
                setError(`Please fill in all details for Stop #${i + 1}`);
                return;
            }
        }

        setIsSavingStops(true);
        setError("");

        try {
            // Add stops sequentially to preserve order
            for (const stop of newStops) {
                await tripApi.addStop(trip.id, {
                    name: stop.name,
                    arrival_time: stop.arrivalTime,
                });
            }

            // Refresh trip data
            const updatedTrip = await tripApi.getById(trip.id);
            if (updatedTrip) setTrip(updatedTrip);

            // Reset form
            setIsBulkMode(false);
            setStopCountToGenerate("");
            setNewStops([]);
        } catch (err: any) {
            console.error('Error adding stops:', err);
            setError(err.message || "Failed to add stops");
        } finally {
            setIsSavingStops(false);
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!trip) return;

        if (!confirm('Are you sure you want to delete this stop?')) return;

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

                {/* Add Stops Section */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-brand-slate mb-4">Add Stops</h2>

                        {!isBulkMode ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-slate mb-2">
                                        How many stops to add?
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={stopCountToGenerate}
                                        placeholder="Enter number (e.g., 5)"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Only allow digits
                                            if (val === "" || /^\d+$/.test(val)) {
                                                if (val === "") {
                                                    setStopCountToGenerate("");
                                                } else {
                                                    const parsed = parseInt(val);
                                                    if (!isNaN(parsed) && parsed <= 20) {
                                                        setStopCountToGenerate(parsed);
                                                    }
                                                }
                                            }
                                        }}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base font-medium text-brand-slate placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                    />
                                    <p className="text-xs text-brand-grey mt-1">Maximum 20 stops at a time</p>
                                </div>
                                <Button
                                    onClick={handleGenerateTable}
                                    className="w-full bg-brand-green hover:bg-green-700"
                                >
                                    Generate Table
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="space-y-4">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-2 mb-2 px-2 hidden sm:grid">
                                        <div className="col-span-1 text-xs font-bold text-brand-slate uppercase">#</div>
                                        <div className="col-span-6 text-xs font-bold text-brand-slate uppercase">Stop Name</div>
                                        <div className="col-span-5 text-xs font-bold text-brand-slate uppercase">Time</div>
                                    </div>

                                    {/* Table Rows */}
                                    {newStops.map((stop, index) => (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                                            <div className="sm:col-span-1 flex items-center mb-2 sm:mb-0">
                                                <div className="w-6 h-6 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center text-xs font-bold mr-2 sm:mr-0">
                                                    {index + 1}
                                                </div>
                                                <span className="sm:hidden text-sm font-bold text-brand-slate">Stop #{index + 1}</span>
                                            </div>
                                            <div className="sm:col-span-6 mb-2 sm:mb-0">
                                                <Input
                                                    placeholder="Enter stop name"
                                                    value={stop.name}
                                                    onChange={(e) => updateNewStop(index, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="sm:col-span-5">
                                                <CustomTimeInput
                                                    value={stop.arrivalTime}
                                                    onChange={(val) => updateNewStop(index, 'arrivalTime', val)}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {error && (
                                        <p className="text-sm text-red-500 text-center">{error}</p>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsBulkMode(false);
                                                setNewStops([]);
                                                setError("");
                                            }}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveStops}
                                            disabled={isSavingStops}
                                            className="flex-1 bg-brand-green hover:bg-green-700"
                                        >
                                            {isSavingStops ? "Saving..." : "Save Stops"}
                                            <Check className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                {/* Existing Stops List */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Existing Stops</h2>
                    {!trip.stops || trip.stops.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MapPin className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                                <p className="text-brand-grey">No stops added yet</p>
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
                                                    <div className="w-8 h-8 bg-brand-slate rounded-full flex items-center justify-center mr-3 shrink-0">
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
